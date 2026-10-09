import { arcEndDay, getArcMilestones, getArcPosition, isArcLength } from '..';

describe('isArcLength', () => {
  it('accepts only 30, 60 and 90', () => {
    expect(isArcLength(30)).toBe(true);
    expect(isArcLength(60)).toBe(true);
    expect(isArcLength(90)).toBe(true);
    expect(isArcLength(45)).toBe(false);
    expect(isArcLength('60')).toBe(false);
    expect(isArcLength(null)).toBe(false);
  });
});

describe('arcEndDay', () => {
  it('matches the prototype: 60 days from 6 October ends 4 December', () => {
    expect(arcEndDay('2026-10-06', 60)).toBe('2026-12-04');
    expect(arcEndDay('2026-10-06', 30)).toBe('2026-11-04');
    expect(arcEndDay('2026-10-06', 90)).toBe('2027-01-03');
  });

  it('treats lengths below 1 as one day', () => {
    expect(arcEndDay('2026-10-06', 0)).toBe('2026-10-06');
  });
});

describe('getArcPosition', () => {
  it('counts days inside the arc', () => {
    expect(getArcPosition('2026-10-06', 60, '2026-10-06')).toEqual({
      phase: 'active',
      dayNumber: 1,
      lengthDays: 60,
    });
    expect(getArcPosition('2026-10-06', 60, '2026-10-17')).toEqual({
      phase: 'active',
      dayNumber: 12,
      lengthDays: 60,
    });
    expect(getArcPosition('2026-10-06', 60, '2026-12-04')).toEqual({
      phase: 'active',
      dayNumber: 60,
      lengthDays: 60,
    });
  });

  it('is finished after the last day and not started before the first', () => {
    expect(getArcPosition('2026-10-06', 60, '2026-12-05').phase).toBe('finished');
    expect(getArcPosition('2026-10-06', 60, '2026-10-05').phase).toBe('notStarted');
  });
});

describe('getArcMilestones', () => {
  it('marks Day I, every ten days and the last day', () => {
    expect(getArcMilestones(60)).toEqual([1, 10, 20, 30, 40, 50, 60]);
    expect(getArcMilestones(30)).toEqual([1, 10, 20, 30]);
    expect(getArcMilestones(25)).toEqual([1, 10, 20, 25]);
  });

  it('copes with tiny or broken lengths', () => {
    expect(getArcMilestones(1)).toEqual([1]);
    expect(getArcMilestones(0)).toEqual([1]);
  });
});
