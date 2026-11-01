import { periodOf } from '@/features/periods';

import {
  firstFocusDay,
  type FocusHistoryFacts,
  focusPeriodBars,
  retreatedMinutes,
  sessionsInPeriod,
  summarizeFocusPeriod,
} from '..';

// 2026-11-01 is a Sunday; its week began on Monday 26 October.
const TODAY = '2026-11-01';

function session(overrides: Partial<FocusHistoryFacts>): FocusHistoryFacts {
  return {
    day: TODAY,
    guard: 'imperium',
    minutes: 25,
    status: 'completed',
    startedAt: '2026-11-01T09:00:00.000Z',
    endedAt: '2026-11-01T09:25:00.000Z',
    ...overrides,
  };
}

describe('retreatedMinutes', () => {
  it('counts the minutes a retreat lasted, within the planned length', () => {
    expect(retreatedMinutes(session({ status: 'abandoned', endedAt: '2026-11-01T09:10:30.000Z' }))).toBe(10);
    expect(retreatedMinutes(session({ status: 'abandoned', endedAt: '2026-11-01T11:00:00.000Z' }))).toBe(25);
  });

  it('reads 0 for held, running, unended and backwards-clock sessions', () => {
    expect(retreatedMinutes(session({}))).toBe(0);
    expect(retreatedMinutes(session({ status: 'running', endedAt: null }))).toBe(0);
    expect(retreatedMinutes(session({ status: 'abandoned', endedAt: null }))).toBe(0);
    expect(retreatedMinutes(session({ status: 'abandoned', endedAt: '2026-11-01T08:00:00.000Z' }))).toBe(0);
    expect(retreatedMinutes(session({ status: 'abandoned', endedAt: 'not a date' }))).toBe(0);
  });
});

describe('the focus log by period', () => {
  const sessions: FocusHistoryFacts[] = [
    session({ day: TODAY, minutes: 45, guard: 'custos' }),
    session({ day: TODAY, minutes: 60, status: 'running', endedAt: null }),
    // Began just before midnight on Saturday: it counts on Saturday.
    session({
      day: '2026-10-31',
      minutes: 90,
      guard: 'silentium',
      startedAt: '2026-10-31T23:30:00.000Z',
      endedAt: '2026-11-01T01:00:00.000Z',
    }),
    session({ day: '2026-10-30', minutes: 30 }),
    session({ day: '2026-10-28', status: 'abandoned', endedAt: '2026-11-01T09:05:00.000Z' }),
    session({ day: '2026-10-20', minutes: 120 }),
  ];
  const week = periodOf('week', TODAY);

  it('stacks held and retreated minutes per day, leaving the running focus out', () => {
    expect(focusPeriodBars(sessions, week)).toEqual({
      held: [0, 0, 0, 0, 30, 90, 45],
      retreated: [0, 0, 5, 0, 0, 0, 0],
    });
  });

  it('sums a year by month', () => {
    const bars = focusPeriodBars(sessions, periodOf('year', TODAY));
    expect(bars.held[9]).toBe(240);
    expect(bars.held[10]).toBe(45);
  });

  it('summarises the week: minutes, sessions, retreats, best day, run and guards', () => {
    expect(summarizeFocusPeriod(sessions, week)).toEqual({
      minutesHeld: 165,
      sessionsHeld: 3,
      sessionsRetreated: 1,
      bestDay: { day: '2026-10-31', minutes: 90 },
      longestRun: 3,
      byGuard: { custos: 45, imperium: 30, silentium: 90 },
    });
  });

  it('is empty for a quiet period', () => {
    expect(summarizeFocusPeriod(sessions, periodOf('month', '2026-08-01'))).toEqual({
      minutesHeld: 0,
      sessionsHeld: 0,
      sessionsRetreated: 0,
      bestDay: null,
      longestRun: 0,
      byGuard: { custos: 0, imperium: 0, silentium: 0 },
    });
    expect(focusPeriodBars([], periodOf('month', '2026-02-01')).held).toHaveLength(28);
  });

  it('lists the finished sessions of a period and finds the first focus day', () => {
    expect(sessionsInPeriod(sessions, week)).toHaveLength(4);
    expect(firstFocusDay(sessions)).toBe('2026-10-20');
    expect(firstFocusDay([session({ status: 'running' })])).toBeNull();
    expect(firstFocusDay([])).toBeNull();
  });
});
