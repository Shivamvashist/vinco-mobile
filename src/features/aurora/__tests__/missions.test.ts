import {
  EMPTY_SWING_STATE,
  GLADIUS_RULES,
  gladiusLeft,
  type MotionSample,
  readSwing,
  swingForce,
  type SwingState,
} from '../gladius';
import { countLeft, EMPTY_STEP_TALLY, MARCH_RULES, type StepTally, tallySteps } from '../march';

describe('march step tally', () => {
  it('treats a first reading right after listening starts as the baseline, not a step', () => {
    const tally = tallySteps(EMPTY_STEP_TALLY, 1, 200);
    expect(tally).toEqual({ baseline: 1, steps: 0 });
    expect(tallySteps(tally, 6, 4000).steps).toBe(5);
  });

  it('keeps a late first reading as a real step', () => {
    const late = MARCH_RULES.activationWindowMs + 500;
    expect(tallySteps(EMPTY_STEP_TALLY, 1, late)).toEqual({ baseline: 0, steps: 1 });
  });

  it('takes batched steps at once and never moves down', () => {
    let tally: StepTally = tallySteps(EMPTY_STEP_TALLY, 1, 100);
    tally = tallySteps(tally, 12, 6000);
    expect(tally.steps).toBe(11);
    tally = tallySteps(tally, 3, 7000);
    expect(tally.steps).toBe(11);
  });

  it('ignores readings that are not numbers', () => {
    const tally = tallySteps(EMPTY_STEP_TALLY, 1, 100);
    expect(tallySteps(tally, Number.NaN, 2000)).toBe(tally);
  });

  it('counts down any goal and never below zero', () => {
    expect(countLeft(4, 30)).toBe(26);
    expect(countLeft(40, 30)).toBe(0);
    expect(countLeft(-2, 30)).toBe(30);
    expect(countLeft(Number.NaN, 30)).toBe(30);
  });
});

/** A reading of `force` g past gravity, straight down the phone's y axis. */
function sample(force: number, atMs: number): MotionSample {
  return { x: 0, y: 1 + force, z: 0, atMs };
}

/** Feeds readings in order. */
function feed(samples: readonly MotionSample[], start: SwingState = EMPTY_SWING_STATE): SwingState {
  return samples.reduce(readSwing, start);
}

describe('gladius swing detector', () => {
  it('measures force past gravity, never below zero', () => {
    expect(swingForce({ x: 0, y: 0, z: 1, atMs: 0 })).toBeCloseTo(0);
    expect(swingForce({ x: 0, y: 0, z: 0.2, atMs: 0 })).toBe(0);
    expect(swingForce({ x: 3, y: 0, z: 0, atMs: 0 })).toBeCloseTo(2);
    expect(swingForce({ x: Number.NaN, y: 0, z: 0, atMs: 0 })).toBe(0);
  });

  it('counts one strong peak as one swing', () => {
    const state = feed([sample(0, 0), sample(1, 20), sample(2.4, 40), sample(2.8, 60), sample(0.2, 80)]);
    expect(state.count).toBe(1);
    expect(state.isArmed).toBe(true);
  });

  it('ignores wiggles under the threshold', () => {
    const wiggles = Array.from({ length: 50 }, (_, k) => sample(k % 2 === 0 ? 1.2 : 0.1, k * 20));
    expect(feed(wiggles).count).toBe(0);
  });

  it('counts the throw and the stop of one swing once (refractory gap)', () => {
    const swing = [
      sample(2.5, 0),
      sample(0.3, 60),
      // The stop: a second peak 150 ms after the throw.
      sample(2.2, 150),
      sample(0.1, 200),
    ];
    expect(feed(swing).count).toBe(1);
  });

  it('needs the reading to settle before the next swing counts', () => {
    const held = [sample(2.5, 0), sample(2.0, 400), sample(2.6, 800)];
    expect(feed(held).count).toBe(1);
  });

  it('counts swings spaced past the gap', () => {
    const swings: MotionSample[] = [];
    for (let k = 0; k < 5; k += 1) {
      const at = k * (GLADIUS_RULES.refractoryMs + 40);
      swings.push(sample(2.4, at), sample(0.1, at + 100));
    }
    expect(feed(swings).count).toBe(5);
  });

  it('stops at the goal', () => {
    const start: SwingState = { count: GLADIUS_RULES.swings, isArmed: true, lastSwingAtMs: null };
    expect(readSwing(start, sample(3, 0)).count).toBe(GLADIUS_RULES.swings);
    expect(gladiusLeft(GLADIUS_RULES.swings)).toBe(0);
    expect(gladiusLeft(12)).toBe(GLADIUS_RULES.swings - 12);
  });

  it('skips a reading without a time', () => {
    expect(readSwing(EMPTY_SWING_STATE, sample(3, Number.NaN))).toBe(EMPTY_SWING_STATE);
  });
});
