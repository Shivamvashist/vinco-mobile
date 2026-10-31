import { buildReminderDays, type ReminderSnapshot } from '..';

/** Day 10 of a 30-day campaign, nothing logged, a 9-day campaign so far. */
function snapshot(overrides: Partial<ReminderSnapshot> = {}): ReminderSnapshot {
  return {
    today: '2026-10-31',
    isLudus: false,
    startDay: '2026-10-22',
    lastDay: '2026-11-20',
    wakeMinutes: 390,
    totalCount: 4,
    heldCount: 0,
    hasAnyLog: false,
    isHeld: false,
    isSickDay: false,
    campaign: 9,
    truceOffer: null,
    truceReserve: 1,
    denarii: 0,
    ...overrides,
  };
}

describe('buildReminderDays', () => {
  it('returns today and the next two days, rolling over the month', () => {
    expect(buildReminderDays(snapshot()).map((item) => item.day)).toEqual([
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
  });

  it("keeps today's real standing and assumes nothing logged on later days", () => {
    const [today, tomorrow] = buildReminderDays(snapshot({ heldCount: 1, hasAnyLog: true }));
    expect(today).toMatchObject({ ordersLeft: 3, hasAnyLog: true, campaignBefore: 9 });
    expect(tomorrow).toMatchObject({ ordersLeft: 4, hasAnyLog: false, isHeld: false, isSickDay: false });
  });

  it('carries a held day into tomorrow: the campaign grows, no Truce window', () => {
    const [today, tomorrow, after] = buildReminderDays(
      snapshot({ isHeld: true, heldCount: 4, campaign: 10 }),
    );
    expect(today).toMatchObject({ isHeld: true, campaignBefore: 9 });
    expect(tomorrow).toMatchObject({ campaignBefore: 10, truceOffer: null });
    // Tomorrow is projected as missed, so the day after opens on a Truce window.
    expect(after).toMatchObject({ campaignBefore: 0, truceOffer: { campaignSaved: 10 } });
  });

  it('projects a Truce window for tomorrow while today is open, if one is affordable', () => {
    const [, tomorrow] = buildReminderDays(snapshot());
    expect(tomorrow).toMatchObject({ campaignBefore: 0, truceOffer: { campaignSaved: 9 } });
    const [, broke] = buildReminderDays(snapshot({ truceReserve: 0, denarii: 0 }));
    expect(broke?.truceOffer).toBeNull();
  });

  it("uses today's Truce offer, and passes it on only when it is affordable", () => {
    const offer = { days: 1, campaignSaved: 14, canAfford: true };
    const [today, tomorrow] = buildReminderDays(
      snapshot({ campaign: 0, truceOffer: offer, truceReserve: 2 }),
    );
    expect(today?.truceOffer).toEqual({ campaignSaved: 14 });
    // Two missed days need two Truces: the reserve of 2 still covers it.
    expect(tomorrow?.truceOffer).toEqual({ campaignSaved: 14 });
    const [cannot] = buildReminderDays(snapshot({ campaign: 0, truceOffer: { ...offer, canAfford: false } }));
    expect(cannot?.truceOffer).toBeNull();
  });

  it('keeps the campaign through a sick day, with no Truce window after it', () => {
    const [today, tomorrow] = buildReminderDays(snapshot({ isSickDay: true }));
    expect(today?.isSickDay).toBe(true);
    expect(tomorrow).toMatchObject({ campaignBefore: 9, truceOffer: null, isSickDay: false });
  });

  it('never offers Truces in free training', () => {
    const days = buildReminderDays(
      snapshot({ isLudus: true, lastDay: null, truceOffer: { days: 1, campaignSaved: 4, canAfford: true } }),
    );
    expect(days.every((item) => item.truceOffer === null)).toBe(true);
    expect(days).toHaveLength(3);
  });

  it('leaves out days after the arc ends and before it starts', () => {
    expect(buildReminderDays(snapshot({ lastDay: '2026-11-01' })).map((item) => item.day)).toEqual([
      '2026-10-31',
      '2026-11-01',
    ]);
    expect(buildReminderDays(snapshot({ startDay: '2026-11-01' })).map((item) => item.day)).toEqual([
      '2026-11-01',
      '2026-11-02',
    ]);
  });

  it('marks a streak reward when holding the day would earn one', () => {
    // A run of 6 going in: day 7 pays 25 denarii and, in a campaign, a Truce.
    const [today] = buildReminderDays(snapshot({ campaign: 6 }));
    expect(today?.streakReward).toEqual({ denarii: 25, hasTruce: true });
    const [ludus] = buildReminderDays(snapshot({ campaign: 6, isLudus: true, lastDay: null }));
    expect(ludus?.streakReward).toEqual({ denarii: 25, hasTruce: false });
    // Day 4 of a week pays nothing extra.
    const [plain] = buildReminderDays(snapshot({ campaign: 3 }));
    expect(plain?.streakReward).toBeNull();
  });
});
