import { AURORA_RULES } from './aurora';
import { countLeft } from './march';

/**
 * Gladius: swing the phone like a sword to stop the alarm. A swing is read from the accelerometer
 * (in g, gravity included). Resting, the reading's size is about 1 g; a real swing throws it well
 * past 2.5 g for a moment. One swing counts once:
 *
 * - **Peak:** the size minus gravity must pass `thresholdG` (1.6 g over rest). Turning the phone,
 *   walking with it or a sleepy wiggle stay under 0.8 g over rest.
 * - **Re-arm:** after a count, the reading must settle back under `rearmG` before the next swing
 *   can count, so the long shake of one swing never counts twice.
 * - **Refractory gap:** at least `refractoryMs` between two counts. A swing has two peaks (the
 *   throw and the stop) about 100 to 200 ms apart; the gap swallows the second.
 */
export const GLADIUS_RULES = {
  swings: AURORA_RULES.gladiusSwings,
  thresholdG: 1.6,
  rearmG: 0.6,
  refractoryMs: 280,
  /** Accelerometer interval: 50 readings a second catches a peak that lasts 40 ms. */
  sampleIntervalMs: 20,
  /** After this long without the 30 swings, a tap way through is offered. */
  tapOfferMs: 60_000,
  /** Finding the accelerometer takes longer than this: swing with taps. */
  checkTimeoutMs: 4000,
} as const;

/** One accelerometer reading, in g, with its time in milliseconds. */
export type MotionSample = { x: number; y: number; z: number; atMs: number };

export type SwingState = {
  count: number;
  /** Ready to count the next peak (the reading settled since the last swing). */
  isArmed: boolean;
  lastSwingAtMs: number | null;
};

export const EMPTY_SWING_STATE: SwingState = { count: 0, isArmed: true, lastSwingAtMs: null };

/** How far past gravity a reading is, in g (0 at rest, never negative). */
export function swingForce(sample: MotionSample): number {
  const size = Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z);
  return Number.isFinite(size) ? Math.max(0, size - 1) : 0;
}

/** Adds one reading. Returns the same state object when nothing changed. */
export function readSwing(state: SwingState, sample: MotionSample): SwingState {
  if (!Number.isFinite(sample.atMs)) return state;
  const force = swingForce(sample);
  if (!state.isArmed) {
    return force < GLADIUS_RULES.rearmG ? { ...state, isArmed: true } : state;
  }
  if (force <= GLADIUS_RULES.thresholdG) return state;
  const last = state.lastSwingAtMs;
  if (last != null && sample.atMs - last < GLADIUS_RULES.refractoryMs) return state;
  return {
    count: Math.min(GLADIUS_RULES.swings, state.count + 1),
    isArmed: false,
    lastSwingAtMs: sample.atMs,
  };
}

/** Swings (or taps) still to go, never below zero. */
export function gladiusLeft(count: number): number {
  return countLeft(count, GLADIUS_RULES.swings);
}
