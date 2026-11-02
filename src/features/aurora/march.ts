import { AURORA_RULES } from './aurora';

/**
 * The march's step tally, fed by expo-sensors' Pedometer on Android.
 *
 * How Android reports steps: the step counter is a running total since the phone booted. The
 * Pedometer module turns it into "steps since this listener started", but it does that by taking
 * the first reading as one step: `reported = total - (firstTotal - 1)`. Most phones send that first
 * reading the moment the listener starts (the current total, not a new step), so a march would
 * begin at 1 with nobody moving. A first reading that arrives within `activationWindowMs` is that
 * start-up reading: it becomes the baseline and counts 0. A first reading that comes later was
 * caused by real steps and keeps its 1.
 *
 * The counter can also batch steps (several at once) and repeats its total after the app returns
 * from the background, so the tally only ever moves up.
 */
export const MARCH_RULES = {
  /** A first reading this soon after listening started is the start-up reading, not a step. */
  activationWindowMs: 1500,
  /** No step at all for this long switches the march to taps (steps still count). */
  noStepsFallbackMs: 20_000,
  /** Finding the step counter takes longer than this: march with taps. */
  checkTimeoutMs: 4000,
  /** After this long without the 30 steps, a tap way through is offered (slow counters, no walk). */
  tapOfferMs: 60_000,
} as const;

export type StepTally = {
  /** The reported value that counts as zero, or null before the first reading. */
  baseline: number | null;
  /** Steps walked since the ring screen started listening. */
  steps: number;
};

export const EMPTY_STEP_TALLY: StepTally = { baseline: null, steps: 0 };

/** Adds one Pedometer reading (`reported`), `sinceStartMs` after listening started. */
export function tallySteps(tally: StepTally, reported: number, sinceStartMs: number): StepTally {
  if (!Number.isFinite(reported)) return tally;
  const value = Math.max(0, Math.floor(reported));
  if (tally.baseline == null) {
    const isStartUp = Number.isFinite(sinceStartMs) && sinceStartMs < MARCH_RULES.activationWindowMs;
    const baseline = isStartUp ? value : Math.max(0, value - 1);
    return { baseline, steps: Math.max(tally.steps, value - baseline) };
  }
  return { baseline: tally.baseline, steps: Math.max(tally.steps, value - tally.baseline) };
}

/** Steps (or taps) still to go on the march, never below zero. */
export function marchLeft(count: number): number {
  return countLeft(count, AURORA_RULES.marchSteps);
}

/** What is left of a goal, from a count that may be odd (negative, fractional, NaN). */
export function countLeft(count: number, goal: number): number {
  const done = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return Math.max(0, goal - done);
}
