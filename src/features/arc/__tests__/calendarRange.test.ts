import { clampMonth, compareMonths, findFirstDay, getCalendarRange } from '..';

describe('getCalendarRange', () => {
  it('runs from the arc start to this month when there are no older records', () => {
    expect(getCalendarRange('2026-08-20', null, '2026-10-31')).toEqual({
      first: { year: 2026, month: 8 },
      last: { year: 2026, month: 10 },
    });
  });

  it('reaches back to the first record of an earlier arc', () => {
    expect(getCalendarRange('2026-10-01', '2026-05-03', '2026-10-31').first).toEqual({
      year: 2026,
      month: 5,
    });
  });

  it('keeps the arc start when it is earlier than every record', () => {
    expect(getCalendarRange('2026-03-01', '2026-06-10', '2026-10-31').first).toEqual({
      year: 2026,
      month: 3,
    });
  });

  it('crosses the year and stops at this month, even after a finished arc', () => {
    expect(getCalendarRange('2025-11-15', null, '2026-02-01')).toEqual({
      first: { year: 2025, month: 11 },
      last: { year: 2026, month: 2 },
    });
  });

  it('never starts after this month (an arc dated ahead by the dev clock)', () => {
    expect(getCalendarRange('2026-12-01', null, '2026-10-31')).toEqual({
      first: { year: 2026, month: 10 },
      last: { year: 2026, month: 10 },
    });
  });

  it('is a single month on the first day', () => {
    const range = getCalendarRange('2026-10-31', null, '2026-10-31');
    expect(compareMonths(range.first, range.last)).toBe(0);
  });
});

describe('clampMonth and findFirstDay', () => {
  const range = { first: { year: 2026, month: 3 }, last: { year: 2026, month: 10 } };
  it('keeps a month inside the range', () => {
    expect(clampMonth({ year: 2025, month: 12 }, range)).toEqual(range.first);
    expect(clampMonth({ year: 2026, month: 11 }, range)).toEqual(range.last);
    expect(clampMonth({ year: 2026, month: 6 }, range)).toEqual({ year: 2026, month: 6 });
  });

  it('finds the earliest day, or null for none', () => {
    expect(findFirstDay([])).toBeNull();
    expect(findFirstDay(['2026-10-02', '2026-09-30', '2026-10-01'])).toBe('2026-09-30');
  });
});
