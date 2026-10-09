import {
  addDays,
  dayOfArc,
  daysBetween,
  daysLeftInYear,
  msUntilNextLocalMidnight,
  parseDayKey,
  toDayKey,
  weekdayIndex,
} from '../dates';

describe('toDayKey', () => {
  it('uses the local calendar date with zero padding', () => {
    expect(toDayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDayKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });

  it('rejects an invalid Date', () => {
    expect(() => toDayKey(new Date('nonsense'))).toThrow('Invalid Date');
  });
});

describe('parseDayKey', () => {
  it('reads valid keys, including 29 February in a leap year', () => {
    expect(parseDayKey('2026-10-17')).toEqual({ year: 2026, month: 10, day: 17 });
    expect(parseDayKey('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 });
  });

  it.each(['2026-02-29', '2026-02-30', '2026-13-01', '2026-00-10', '2026-1-5', '', 'today'])(
    'rejects %p',
    (key) => {
      expect(() => parseDayKey(key)).toThrow('Invalid day key');
    },
  );
});

describe('daysBetween and addDays', () => {
  it('counts across month and year ends', () => {
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-11-01', '2026-10-31')).toBe(-1);
    expect(daysBetween('2026-10-17', '2026-10-17')).toBe(0);
  });

  it('counts across a leap day', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });

  it('is not affected by daylight-saving changes (late March and late October in Europe)', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('adds and subtracts days', () => {
    expect(addDays('2026-10-06', 59)).toBe('2026-12-04');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2026-10-17', 0)).toBe('2026-10-17');
  });
});

describe('daysLeftInYear', () => {
  it('matches the prototype: 17 October 2026 has 75 days left', () => {
    expect(daysLeftInYear('2026-10-17')).toBe(75);
  });

  it('is 0 on the last day and 364 on the first (365 in a leap year)', () => {
    expect(daysLeftInYear('2026-12-31')).toBe(0);
    expect(daysLeftInYear('2026-01-01')).toBe(364);
    expect(daysLeftInYear('2028-01-01')).toBe(365);
  });
});

describe('dayOfArc', () => {
  it('starts at 1 on the start day', () => {
    expect(dayOfArc('2026-10-06', '2026-10-06')).toBe(1);
    expect(dayOfArc('2026-10-06', '2026-10-17')).toBe(12);
  });

  it('is 0 before the arc starts', () => {
    expect(dayOfArc('2026-10-06', '2026-10-01')).toBe(0);
  });
});

describe('weekdayIndex', () => {
  it('gives 0 for Sunday and 6 for Saturday', () => {
    expect(weekdayIndex('2026-10-17')).toBe(6);
    expect(weekdayIndex('2026-10-18')).toBe(0);
  });
});

describe('msUntilNextLocalMidnight', () => {
  it('counts to the next local midnight', () => {
    expect(msUntilNextLocalMidnight(new Date(2026, 9, 17, 23, 59, 0))).toBe(60_000);
    expect(msUntilNextLocalMidnight(new Date(2026, 9, 17, 0, 0, 0))).toBe(24 * 60 * 60 * 1000);
  });

  it('rejects an invalid Date', () => {
    expect(() => msUntilNextLocalMidnight(new Date(NaN))).toThrow('Invalid Date');
  });
});
