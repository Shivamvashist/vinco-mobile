import { buildOrderTargets, DEFAULT_ORDER_TARGETS, fitToRange, FULL_GOAL_RANGES, WAKE_TIME_RANGE } from '..';

describe('fitToRange', () => {
  it('clamps and snaps to the step grid', () => {
    expect(fitToRange(3.7, FULL_GOAL_RANGES.water, 4)).toBe(3.5);
    expect(fitToRange(9, FULL_GOAL_RANGES.water, 4)).toBe(5);
    expect(fitToRange(0, FULL_GOAL_RANGES.water, 4)).toBe(2);
    expect(fitToRange(7 * 60 + 7, WAKE_TIME_RANGE, 390)).toBe(7 * 60);
  });

  it('falls back for anything that is not a finite number', () => {
    expect(fitToRange(undefined, FULL_GOAL_RANGES.meal, 2)).toBe(2);
    expect(fitToRange('3', FULL_GOAL_RANGES.meal, 2)).toBe(2);
    expect(fitToRange(NaN, FULL_GOAL_RANGES.meal, 2)).toBe(2);
  });
});

describe('buildOrderTargets', () => {
  it('uses defaults when nothing is tuned', () => {
    expect(buildOrderTargets({})).toEqual(DEFAULT_ORDER_TARGETS);
  });

  it('applies tuned full goals and keeps the fixed minimums', () => {
    const targets = buildOrderTargets({ water: 3.5, meal: 3, workout: 60 });
    expect(targets.water).toEqual({ min: 1, full: 3.5, step: 1 });
    expect(targets.meal).toEqual({ min: 1, full: 3, step: 1 });
    expect(targets.workout).toEqual({ min: 15, full: 60, step: 60 });
    expect(targets.wake).toEqual(DEFAULT_ORDER_TARGETS.wake);
  });

  it('repairs impossible values', () => {
    const targets = buildOrderTargets({ water: -2, meal: 99, workout: NaN });
    expect(targets.water.full).toBe(2);
    expect(targets.meal.full).toBe(3);
    expect(targets.workout.full).toBe(40);
  });
});
