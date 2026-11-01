import {
  firstReelDay,
  reelBarValues,
  reelRangeNavigation,
  reelRangeOf,
  reelReferenceValue,
  shiftReelRange,
} from '../reelHistory';

// 2026-11-04 is a Wednesday.
const TODAY = '2026-11-04';

describe('reel log ranges', () => {
  it('shows the Monday-first week in Day view', () => {
    const range = reelRangeOf('day', TODAY);
    expect(range.start).toBe('2026-11-02');
    expect(range.end).toBe('2026-11-08');
    expect(range.spans).toHaveLength(7);
  });

  it('shows eight weeks ending with this one in Week view', () => {
    const range = reelRangeOf('week', TODAY);
    expect(range.spans).toHaveLength(8);
    expect(range.start).toBe('2026-09-14');
    expect(range.end).toBe('2026-11-08');
    expect(shiftReelRange(range, -1).end).toBe('2026-09-13');
  });

  it('steps back only to history, forward only to today', () => {
    const range = reelRangeOf('day', TODAY);
    expect(reelRangeNavigation(range, null, TODAY)).toEqual({ canGoBack: false, canGoForward: false });
    expect(reelRangeNavigation(range, '2026-10-30', TODAY).canGoBack).toBe(true);
    expect(reelRangeNavigation(shiftReelRange(range, -1), '2026-10-30', TODAY).canGoForward).toBe(true);
  });
});

describe('reel log bars', () => {
  const days = [
    { day: '2026-11-02', count: 40 },
    { day: '2026-11-03', count: 50 },
    { day: '2026-10-27', count: 10 },
  ];

  it('splits each day at its own allowance (the budget plus the passes of that day)', () => {
    const values = reelBarValues(reelRangeOf('day', TODAY), days, 30, new Map([['2026-11-03', 1]]));
    expect(values[0]).toEqual({ within: 30, over: 10, total: 40 });
    expect(values[1]).toEqual({ within: 42, over: 8, total: 50 });
    expect(values[2]).toEqual({ within: 0, over: 0, total: 0 });
  });

  it('adds a week up from its days', () => {
    const values = reelBarValues(reelRangeOf('week', TODAY), days, 30, new Map());
    expect(values[7]).toEqual({ within: 60, over: 30, total: 90 });
    expect(values[6]).toEqual({ within: 10, over: 0, total: 10 });
  });

  it('draws the budget per day or per week, and finds the first day', () => {
    expect(reelReferenceValue('day', 30)).toBe(30);
    expect(reelReferenceValue('week', 30)).toBe(210);
    expect(firstReelDay(days)).toBe('2026-10-27');
    expect(firstReelDay([])).toBeNull();
  });
});
