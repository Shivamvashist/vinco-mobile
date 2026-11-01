import {
  bucketDayValues,
  bucketIndexOf,
  bucketSums,
  clampDay,
  longestDayRun,
  niceCeiling,
  periodBuckets,
  periodNavigation,
  periodOf,
  shiftPeriod,
  shouldLabelBucket,
} from '..';

// 2026-11-01 is a Sunday; its week began on Monday 26 October.
const TODAY = '2026-11-01';

describe('periodOf', () => {
  it('finds the day, the Monday-first week, the month and the year', () => {
    expect(periodOf('day', TODAY)).toEqual({ kind: 'day', start: TODAY, end: TODAY });
    expect(periodOf('week', TODAY)).toEqual({ kind: 'week', start: '2026-10-26', end: TODAY });
    expect(periodOf('week', '2026-10-26')).toMatchObject({ start: '2026-10-26' });
    expect(periodOf('month', '2026-10-17')).toEqual({
      kind: 'month',
      start: '2026-10-01',
      end: '2026-10-31',
    });
    expect(periodOf('year', TODAY)).toEqual({ kind: 'year', start: '2026-01-01', end: '2026-12-31' });
  });

  it('knows leap years and short months', () => {
    expect(periodOf('month', '2028-02-10').end).toBe('2028-02-29');
    expect(periodOf('month', '2026-02-10').end).toBe('2026-02-28');
    expect(periodOf('month', '2026-04-30').end).toBe('2026-04-30');
  });

  it('crosses years for a week that spans New Year', () => {
    expect(periodOf('week', '2027-01-01')).toMatchObject({ start: '2026-12-28', end: '2027-01-03' });
  });
});

describe('shiftPeriod', () => {
  it('steps every kind back and forward', () => {
    expect(shiftPeriod(periodOf('day', '2026-03-01'), -1).start).toBe('2026-02-28');
    expect(shiftPeriod(periodOf('week', TODAY), -1)).toMatchObject({
      start: '2026-10-19',
      end: '2026-10-25',
    });
    expect(shiftPeriod(periodOf('month', '2026-01-15'), -1)).toMatchObject({
      start: '2025-12-01',
      end: '2025-12-31',
    });
    expect(shiftPeriod(periodOf('month', '2026-01-31'), 1).end).toBe('2026-02-28');
    expect(shiftPeriod(periodOf('year', TODAY), -2).start).toBe('2024-01-01');
  });

  it('is DST safe: a week across the March and October clock changes is still 7 days', () => {
    const march = periodOf('week', '2026-03-29');
    expect(periodBuckets(march)).toHaveLength(7);
    expect(shiftPeriod(march, 1).start).toBe('2026-03-30');
    expect(periodBuckets(periodOf('week', '2026-10-25'))).toHaveLength(7);
  });
});

describe('navigation', () => {
  it('stops forward at the current period and back at the first day', () => {
    expect(periodNavigation(periodOf('week', TODAY), '2026-10-01', TODAY)).toEqual({
      canGoBack: true,
      canGoForward: false,
    });
    expect(periodNavigation(periodOf('month', '2026-10-05'), '2026-10-01', TODAY)).toEqual({
      canGoBack: false,
      canGoForward: true,
    });
  });

  it('never goes back without history', () => {
    expect(periodNavigation(periodOf('year', TODAY), null, TODAY).canGoBack).toBe(false);
  });

  it('clamps a day between the first day and today', () => {
    expect(clampDay('2027-01-01', '2026-01-01', TODAY)).toBe(TODAY);
    expect(clampDay('2025-01-01', '2026-01-01', TODAY)).toBe('2026-01-01');
    expect(clampDay('2025-01-01', null, TODAY)).toBe('2025-01-01');
    // A first day still to come (an arc starting tomorrow) never pushes past today.
    expect(clampDay(TODAY, '2026-11-02', TODAY)).toBe(TODAY);
  });
});

describe('buckets', () => {
  it('gives a bar a day, or a month a bar for a year', () => {
    expect(periodBuckets(periodOf('day', TODAY))).toHaveLength(1);
    expect(periodBuckets(periodOf('month', '2026-10-01'))).toHaveLength(31);
    const year = periodBuckets(periodOf('year', '2028-06-01'));
    expect(year).toHaveLength(12);
    expect(year[1]).toEqual({ index: 1, start: '2028-02-01', end: '2028-02-29' });
  });

  it('finds the bar for a day', () => {
    expect(bucketIndexOf(periodOf('week', TODAY), TODAY)).toBe(6);
    expect(bucketIndexOf(periodOf('year', TODAY), '2026-12-31')).toBe(11);
    expect(bucketIndexOf(periodOf('week', TODAY), '2026-11-02')).toBe(-1);
  });

  it('sums items into bars, skipping outsiders and bad values', () => {
    const items = [
      { day: '2026-10-26', value: 10 },
      { day: '2026-10-26', value: 5 },
      { day: TODAY, value: Number.NaN },
      { day: '2026-10-25', value: 99 },
      { day: '2026-10-30', value: 1e9 },
    ];
    expect(
      bucketSums(
        periodOf('week', TODAY),
        items,
        (item) => item.day,
        (item) => item.value,
      ),
    ).toEqual([15, 0, 0, 0, 1e9, 0, 0]);
  });

  it('reads values by day, zero where none', () => {
    const byDay = new Map([
      ['2026-10-03', 40],
      ['2026-09-30', 8],
    ]);
    const year = bucketDayValues(periodOf('year', TODAY), byDay);
    expect(year[9]).toBe(40);
    expect(year[8]).toBe(8);
    expect(bucketDayValues(periodOf('week', TODAY), byDay)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('labels a month on the 1st and every 5th day', () => {
    const labelled = periodBuckets(periodOf('month', '2026-10-01'))
      .filter((bucket) => shouldLabelBucket('month', bucket))
      .map((bucket) => bucket.start.slice(8));
    expect(labelled).toEqual(['01', '05', '10', '15', '20', '25', '30']);
    expect(periodBuckets(periodOf('week', TODAY)).every((bucket) => shouldLabelBucket('week', bucket))).toBe(
      true,
    );
  });
});

describe('niceCeiling', () => {
  it('rounds the top of the scale up to a round number', () => {
    expect(niceCeiling(47)).toBe(50);
    expect(niceCeiling(120)).toBe(200);
    expect(niceCeiling(201)).toBe(250);
    expect(niceCeiling(1000)).toBe(1000);
    expect(niceCeiling(12_345_678)).toBe(20_000_000);
  });

  it('keeps a floor for empty and tiny periods', () => {
    expect(niceCeiling(0)).toBe(1);
    expect(niceCeiling(0, 60)).toBe(60);
    expect(niceCeiling(30, 60)).toBe(60);
    expect(niceCeiling(Number.NaN, 60)).toBe(60);
    expect(niceCeiling(-5)).toBe(1);
  });
});

describe('longestDayRun', () => {
  it('counts days in a row, across a month end, in any order', () => {
    expect(longestDayRun([])).toBe(0);
    expect(longestDayRun(['2026-10-31', '2026-11-01', '2026-10-30', '2026-10-30', '2026-10-20'])).toBe(3);
    expect(longestDayRun(['2026-10-01', '2026-10-03'])).toBe(1);
  });
});
