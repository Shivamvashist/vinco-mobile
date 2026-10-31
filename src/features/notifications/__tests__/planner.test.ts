import {
  applyDailyCap,
  atLocalTime,
  DEFAULT_REMINDER_SETTINGS,
  isQuietTime,
  type PlannedReminder,
  planReminders,
  type ReminderDay,
  type ReminderSettings,
} from '..';

const TODAY = '2026-10-31';

/** An open campaign day with nothing logged, 6:30 wake-up, four orders. */
function day(overrides: Partial<ReminderDay> = {}): ReminderDay {
  return {
    day: TODAY,
    isLudus: false,
    wakeMinutes: 6 * 60 + 30,
    totalCount: 4,
    ordersLeft: 4,
    hasAnyLog: false,
    isHeld: false,
    isSickDay: false,
    campaignBefore: 5,
    truceOffer: null,
    streakReward: null,
    ...overrides,
  };
}

const at = (dayKey: string, hours: number, minutes = 0) =>
  new Date(atLocalTime(dayKey, hours * 60 + minutes));
const early = at(TODAY, 0, 5);

function plan(days: ReminderDay[], now = early, settings: ReminderSettings = DEFAULT_REMINDER_SETTINGS) {
  return planReminders({ settings, days, now });
}

const kinds = (list: PlannedReminder[]) => list.map((item) => item.kind);

describe('planReminders', () => {
  it('plans morning, evening and last call for an open campaign day, in time order', () => {
    const list = plan([day()]);
    expect(kinds(list)).toEqual(['morning', 'evening', 'lastCall']);
    expect(list[0]?.fireAt).toEqual(at(TODAY, 7, 0));
    expect(list[1]?.fireAt).toEqual(at(TODAY, 20, 30));
    expect(list[2]?.fireAt).toEqual(at(TODAY, 22, 45));
    expect(list.every((item) => item.url === '/veni')).toBe(true);
    expect(list[0]?.id).toBe('vinco.reminder.2026-10-31.morning');
  });

  it('plans nothing when reminders are off', () => {
    expect(plan([day()], early, { ...DEFAULT_REMINDER_SETTINGS, isOn: false })).toEqual([]);
  });

  it('respects each kind toggle', () => {
    const settings = {
      ...DEFAULT_REMINDER_SETTINGS,
      kinds: { ...DEFAULT_REMINDER_SETTINGS.kinds, morning: false, lastCall: false },
    };
    expect(kinds(plan([day()], early, settings))).toEqual(['evening']);
  });

  it('uses the evening time the user set', () => {
    const settings = { ...DEFAULT_REMINDER_SETTINGS, eveningMinutes: 19 * 60 };
    expect(plan([day()], early, settings).find((item) => item.kind === 'evening')?.fireAt).toEqual(
      at(TODAY, 19),
    );
  });

  it('withdraws the morning reminder once anything is logged', () => {
    expect(kinds(plan([day({ hasAnyLog: true, ordersLeft: 3 })]))).toEqual(['evening', 'lastCall']);
  });

  it('plans nothing on a held day, a sick day, or a day with no orders', () => {
    expect(plan([day({ isHeld: true, ordersLeft: 0 })])).toEqual([]);
    expect(plan([day({ isSickDay: true })])).toEqual([]);
    expect(plan([day({ totalCount: 0, ordersLeft: 0 })])).toEqual([]);
  });

  it('gives free training no last call and no Truce window, with gentle messages', () => {
    const list = plan([day({ isLudus: true, campaignBefore: 9, truceOffer: { campaignSaved: 9 } })]);
    expect(kinds(list)).toEqual(['morning', 'evening']);
    expect(list[0]?.message).toEqual({ kind: 'morning', isLudus: true, orderCount: 4 });
  });

  it('keeps the last call for campaigns of two days or more', () => {
    expect(kinds(plan([day({ campaignBefore: 1 })]))).toEqual(['morning', 'evening']);
    expect(kinds(plan([day({ campaignBefore: 2 })]))).toContain('lastCall');
  });

  it('puts the Truce window in the morning slot, instead of the morning reminder', () => {
    const list = plan([day({ campaignBefore: 0, truceOffer: { campaignSaved: 12 } })]);
    expect(kinds(list)).toEqual(['truceWindow', 'evening']);
    expect(list[0]?.fireAt).toEqual(at(TODAY, 7));
    expect(list[0]?.message).toEqual({ kind: 'truceWindow', campaignSaved: 12 });
  });

  it('falls back to the morning reminder when the Truce window is switched off', () => {
    const settings = {
      ...DEFAULT_REMINDER_SETTINGS,
      kinds: { ...DEFAULT_REMINDER_SETTINGS.kinds, truceWindow: false },
    };
    const list = plan([day({ campaignBefore: 0, truceOffer: { campaignSaved: 12 } })], early, settings);
    expect(kinds(list)).toEqual(['morning', 'evening']);
  });

  it('drops reminders already in the past', () => {
    expect(kinds(plan([day()], at(TODAY, 7, 0)))).toEqual(['evening', 'lastCall']);
    expect(kinds(plan([day()], at(TODAY, 21)))).toEqual(['lastCall']);
    expect(plan([day()], at(TODAY, 23))).toEqual([]);
  });

  it('keeps quiet hours: nothing from 11 pm until the wake time', () => {
    // A wake time of 11 pm would put the morning reminder at 11:30 pm: quiet, so dropped.
    expect(kinds(plan([day({ wakeMinutes: 23 * 60 })]))).not.toContain('morning');
    expect(isQuietTime(23 * 60, 390)).toBe(true);
    expect(isQuietTime(6 * 60, 390)).toBe(true);
    expect(isQuietTime(6 * 60 + 30, 390)).toBe(false);
    expect(isQuietTime(22 * 60 + 59, 390)).toBe(false);
    // A very late wake time still frees the afternoon.
    expect(isQuietTime(13 * 60, 14 * 60)).toBe(false);
  });

  it('carries a streak reward into the evening message', () => {
    const reward = { denarii: 25, hasTruce: true };
    const evening = plan([day({ streakReward: reward })]).find((item) => item.kind === 'evening');
    expect(evening?.message).toEqual({ kind: 'evening', isLudus: false, ordersLeft: 4, reward });
  });

  it('plans each day on its own calendar day, across the month end', () => {
    const list = plan([day(), day({ day: '2026-11-01' }), day({ day: '2026-11-02' })]);
    expect(list).toHaveLength(9);
    expect(list.filter((item) => item.day === '2026-11-01').map((item) => item.fireAt)).toEqual([
      at('2026-11-01', 7),
      at('2026-11-01', 20, 30),
      at('2026-11-01', 22, 45),
    ]);
    expect(new Set(list.map((item) => item.id)).size).toBe(9);
  });
});

describe('applyDailyCap', () => {
  const make = (kind: PlannedReminder['kind'], hours: number): PlannedReminder => ({
    id: kind,
    kind,
    day: TODAY,
    fireAt: at(TODAY, hours),
    url: '/veni',
    message: { kind: 'lastCall', campaign: 3 },
  });

  it('keeps the highest-priority reminders, then sorts them by time', () => {
    const list = applyDailyCap(
      [make('morning', 7), make('evening', 20), make('lastCall', 22), make('truceWindow', 8)],
      3,
    );
    expect(kinds(list)).toEqual(['truceWindow', 'evening', 'lastCall']);
  });

  it('keeps nothing with a cap of zero or less', () => {
    expect(applyDailyCap([make('morning', 7)], 0)).toEqual([]);
    expect(applyDailyCap([make('morning', 7)], -1)).toEqual([]);
  });
});

describe('atLocalTime', () => {
  it('builds the local clock time from the day parts', () => {
    const date = atLocalTime('2026-03-29', 20 * 60 + 30);
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual(
      [2026, 2, 29, 20, 30],
    );
  });

  it('keeps the clock time on daylight-saving days (whatever the test machine zone)', () => {
    // 29 March 2026 and 25 October 2026 are DST switch days in Europe.
    for (const key of ['2026-03-29', '2026-10-25', '2026-11-01']) {
      const date = atLocalTime(key, 22 * 60 + 45);
      expect([date.getHours(), date.getMinutes()]).toEqual([22, 45]);
    }
  });

  it('refuses a malformed day', () => {
    expect(() => atLocalTime('2026-02-30', 60)).toThrow();
  });
});
