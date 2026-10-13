import {
  clampReelBudget,
  getImperiumGate,
  getReelAllowance,
  getReelMilestone,
  getTributumPrice,
  levelIncludes,
} from '../guard';

describe('guard rules', () => {
  it('keeps the reel budget in range and on a step', () => {
    expect(clampReelBudget(32)).toBe(30);
    expect(clampReelBudget(1)).toBe(5);
    expect(clampReelBudget(999)).toBe(200);
    expect(clampReelBudget('lots')).toBe(30);
  });

  it('marks milestones every 25 reels', () => {
    expect(getReelMilestone(25)).toBe(25);
    expect(getReelMilestone(50)).toBe(50);
    expect(getReelMilestone(26)).toBeNull();
    expect(getReelMilestone(0)).toBeNull();
  });

  it('doubles the Tributum, three times a day at most', () => {
    expect([0, 1, 2, 3].map(getTributumPrice)).toEqual([15, 30, 60, null]);
    expect(getReelAllowance(30, 2)).toBe(50);
    expect(getReelAllowance(30, 9)).toBe(60);
  });

  it('includes the levels below', () => {
    expect(levelIncludes('imperium', 'vigil')).toBe(true);
    expect(levelIncludes('pax', 'vigil')).toBe(false);
  });

  it('opens Imperium under the limit, and offers Clementia once the orders hold', () => {
    const base = { reelsToday: 10, allowance: 30, areAllOrdersHeld: false, hasUsedClementiaToday: false };
    expect(getImperiumGate(base)).toEqual({ state: 'open' });
    expect(getImperiumGate({ ...base, reelsToday: 30 })).toEqual({ state: 'locked', canUseClementia: false });
    expect(getImperiumGate({ ...base, reelsToday: 30, areAllOrdersHeld: true })).toEqual({
      state: 'locked',
      canUseClementia: true,
    });
    expect(
      getImperiumGate({ ...base, reelsToday: 30, areAllOrdersHeld: true, hasUsedClementiaToday: true }),
    ).toEqual({ state: 'locked', canUseClementia: false });
  });
});
