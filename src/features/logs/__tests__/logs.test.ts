import { chartMax, orderBars, sleepBars, summarizeBars, weekDays, weekStartOf, weightTrend } from '..';

// Monday 12 October 2026.
const MONDAY = '2026-10-12';

describe('weeks', () => {
  it('start on Monday', () => {
    expect(weekStartOf('2026-10-18')).toBe(MONDAY);
    expect(weekStartOf(MONDAY)).toBe(MONDAY);
    expect(weekDays(MONDAY)).toHaveLength(7);
    expect(weekDays(MONDAY)[6]).toBe('2026-10-18');
  });
});

describe('bars', () => {
  const days = weekDays(MONDAY);

  it('marks short nights and leaves unlogged days empty', () => {
    const bars = sleepBars(
      days,
      new Map([
        [MONDAY, 450],
        ['2026-10-13', 300],
      ]),
    );
    expect(bars.slice(0, 3).map((bar) => bar.tone)).toEqual(['rest', 'short', 'empty']);
  });

  it('colours order days by goal', () => {
    const target = { min: 1, full: 4, step: 1 };
    const bars = orderBars(
      days,
      new Map([
        [MONDAY, 5],
        ['2026-10-13', 2],
        ['2026-10-14', 0],
      ]),
      target,
    );
    expect(bars.slice(0, 4).map((bar) => bar.tone)).toEqual(['full', 'held', 'short', 'empty']);
  });

  it('summarises a week', () => {
    const bars = sleepBars(
      days,
      new Map([
        [MONDAY, 400],
        ['2026-10-15', 500],
      ]),
    );
    expect(summarizeBars(bars, 450)).toEqual({
      loggedDays: 2,
      average: 450,
      total: 900,
      best: { day: '2026-10-15', value: 500 },
      daysAtGoal: 1,
    });
    expect(summarizeBars(sleepBars(days, new Map()))).toMatchObject({ average: null, best: null });
  });

  it('leaves headroom above the largest value or the target', () => {
    expect(chartMax([2, null, 3], 4)).toBeCloseTo(4.6);
    expect(chartMax([10], 4)).toBeCloseTo(11.5);
    expect(chartMax([], 0)).toBe(1);
  });
});

describe('weightTrend', () => {
  it('compares this week with last week', () => {
    const points = [
      { day: '2026-10-06', kg: 73 },
      { day: '2026-10-08', kg: 73.4 },
      { day: '2026-10-13', kg: 72.6 },
      { day: '2026-10-15', kg: 72.8 },
    ];
    const trend = weightTrend(points, '2026-10-16');
    expect(trend.thisWeek).toBeCloseTo(72.7);
    expect(trend.lastWeek).toBeCloseTo(73.2);
    expect(trend.change).toBe(-0.5);
  });

  it('has no change without both weeks', () => {
    expect(weightTrend([{ day: '2026-10-13', kg: 72 }], '2026-10-16')).toEqual({
      thisWeek: 72,
      lastWeek: null,
      change: null,
    });
    expect(weightTrend([], '2026-10-16').thisWeek).toBeNull();
  });
});
