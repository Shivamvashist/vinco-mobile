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
  /**
   * Springs for things the hand moves (31 Oct): presses, toggles, numbers and the focus morph.
   * Physical, not timed, so an interrupted motion picks up from where it is.
   * press: the quick give under a finger. settle: a value or card arriving. morph: a view that
   * grows into another (the focus CTA into the focus view). pop: a small celebration overshoot.
   */
  spring: {
    press: { damping: 18, stiffness: 420, mass: 0.6 },
    settle: { damping: 20, stiffness: 220, mass: 1 },
    morph: { damping: 24, stiffness: 180, mass: 1 },
    pop: { damping: 10, stiffness: 260, mass: 0.8 },
  },
  /** How far a pressed surface gives: cards less than buttons. */
  pressScale: { button: 0.96, card: 0.98, row: 0.985 },
} as const satisfies {
  duration: Record<string, number>;
  easing: Record<string, readonly [number, number, number, number]>;
  stagger: number;
  spring: Record<string, { damping: number; stiffness: number; mass: number }>;
  pressScale: Record<string, number>;
};

export type MotionSpring = keyof typeof motion.spring;

export type MotionDuration = keyof typeof motion.duration;
export type MotionEasing = keyof typeof motion.easing;
