import {
  addDays,
  dayOfArc,
  eachDay,
  formatClockMinutes,
  formatClockTime,
  parseClockMinutes,
  toClockString,
  daysBetween,
  daysLeftInYear,
  monthGrid,
  msUntilNextLocalMidnight,
  parseDayKey,
  shiftMonth,
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

describe('formatClockTime', () => {
  it.each([
    [new Date(2026, 9, 17, 6, 34), '6:34 am'],
    [new Date(2026, 9, 17, 0, 5), '12:05 am'],
    [new Date(2026, 9, 17, 12, 0), '12:00 pm'],
    [new Date(2026, 9, 17, 23, 59), '11:59 pm'],
  ])('%p reads %p', (date, expected) => {
    expect(formatClockTime(date)).toBe(expected);
  });

  it('rejects an invalid Date', () => {
    expect(() => formatClockTime(new Date(NaN))).toThrow('Invalid Date');
  });
});

describe('clock minutes', () => {
  it('parses valid 24-hour times and rejects the rest', () => {
    expect(parseClockMinutes('06:30')).toBe(390);
    expect(parseClockMinutes('00:00')).toBe(0);
    expect(parseClockMinutes('23:59')).toBe(1439);
    expect(parseClockMinutes('24:00')).toBeNull();
    expect(parseClockMinutes('6:30')).toBeNull();
    expect(parseClockMinutes('06:60')).toBeNull();
    expect(parseClockMinutes('')).toBeNull();
  });

  it('formats minutes back, wrapping around the day', () => {
    expect(toClockString(390)).toBe('06:30');
    expect(toClockString(1440)).toBe('00:00');
    expect(toClockString(-15)).toBe('23:45');
  });

  it('reads minutes in 12-hour form', () => {
    expect(formatClockMinutes(390)).toBe('6:30 am');
    expect(formatClockMinutes(12 * 60)).toBe('12:00 pm');
  });
});

describe('eachDay', () => {
  it('lists every day inclusive, across a month end', () => {
    expect(eachDay('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(eachDay('2026-10-17', '2026-10-17')).toEqual(['2026-10-17']);
  });

  it('is empty when the range is backwards', () => {
    expect(eachDay('2026-10-17', '2026-10-16')).toEqual([]);
  });
});

describe('monthGrid', () => {
  it('lays out October 2026 Monday first (1 October is a Thursday)', () => {
    const grid = monthGrid(2026, 10);
    expect(grid[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(grid.flat().filter(Boolean)).toHaveLength(31);
    expect(grid.every((row) => row.length === 7)).toBe(true);
  });

  it('handles February in a leap year and a month starting on Monday', () => {
    expect(monthGrid(2028, 2).flat().filter(Boolean)).toHaveLength(29);
    expect(monthGrid(2026, 6)[0]?.[0]).toBe('2026-06-01');
  });

  it('rejects an impossible month', () => {
    expect(() => monthGrid(2026, 13)).toThrow('Invalid day key');
  });
});

describe('shiftMonth', () => {
  it('moves across year ends both ways', () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2027, 1, -1)).toEqual({ year: 2026, month: 12 });
    expect(shiftMonth(2026, 10, 0)).toEqual({ year: 2026, month: 10 });
  });
});
