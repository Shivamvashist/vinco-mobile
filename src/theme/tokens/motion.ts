/**
 * Motion tokens. Vinco is "quick and quiet" everywhere except the VINCO stamp.
 * Durations are in milliseconds. Easings are cubic-bezier control points, used with
 * Reanimated as `Easing.bezier(...motion.easing.standard)`.
 */
export const motion = {
  duration: {
    instant: 100,
    fast: 200,
    base: 350,
    slow: 500,
    slower: 800,
  },
  easing: {
    /** Default for things entering or changing state. */
    standard: [0.2, 0.8, 0.2, 1],
    /** Softer entrance for staggered lists. */
    entrance: [0.2, 0.7, 0.2, 1],
    /** Things leaving the screen. */
    exit: [0.4, 0, 1, 1],
  },
  /** Delay between items in a staggered list. */
  stagger: 60,
} as const satisfies {
  duration: Record<string, number>;
  easing: Record<string, readonly [number, number, number, number]>;
  stagger: number;
};

export type MotionDuration = keyof typeof motion.duration;
export type MotionEasing = keyof typeof motion.easing;
