import { dayOfStreakWeek, getNextStreakReward, getStreakAwards } from '../streak';

describe('dayOfStreakWeek', () => {
  it('counts 1 to 7 and starts again', () => {
    expect([0, 1, 3, 7, 8, 14, 15].map(dayOfStreakWeek)).toEqual([0, 1, 3, 7, 1, 7, 1]);
  });

  it('treats bad input as no run', () => {
    expect(dayOfStreakWeek(Number.NaN)).toBe(0);
    expect(dayOfStreakWeek(-3)).toBe(0);
  });
});

describe('getStreakAwards', () => {
  const paid = (streak: number) => getStreakAwards('2026-10-31', 'held', streak).map((award) => award.amount);

  it('pays on days 3, 5 and 7 of every week of the run', () => {
    expect(paid(1)).toEqual([]);
    expect(paid(3)).toEqual([10]);
    expect(paid(5)).toEqual([15]);
    expect(paid(7)).toEqual([25]);
    expect(paid(10)).toEqual([10]);
  });

  it('adds the milestone bonus on long runs', () => {
    expect(getStreakAwards('2026-10-31', 'conquered', 30).map((award) => award.reason)).toEqual([
      'streak_milestone',
    ]);
    expect(paid(14)).toEqual([25, 50]);
  });

  it('pays nothing for a Truce day or a miss', () => {
    expect(getStreakAwards('2026-10-31', 'truce', 7)).toEqual([]);
    expect(getStreakAwards('2026-10-31', 'missed', 3)).toEqual([]);
  });
});

describe('getNextStreakReward', () => {
  it('finds the next paying day', () => {
    expect(getNextStreakReward(0, true)).toEqual({ inDays: 3, atStreak: 3, denarii: 10, hasTruce: false });
    expect(getNextStreakReward(4, true)).toEqual({ inDays: 1, atStreak: 5, denarii: 15, hasTruce: false });
  });

  it('marks the Truce on every 7th day in a campaign only', () => {
    expect(getNextStreakReward(6, true)).toMatchObject({ inDays: 1, denarii: 25, hasTruce: true });
    expect(getNextStreakReward(6, false)).toMatchObject({ inDays: 1, denarii: 25, hasTruce: false });
  });

  it('starts over after a week', () => {
    expect(getNextStreakReward(7, true)).toMatchObject({ atStreak: 10, inDays: 3 });
  });
});
