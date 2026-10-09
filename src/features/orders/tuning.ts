import { roundToHundredths } from '@/lib/progress';

import { DEFAULT_ORDER_TARGETS } from './orders';
import type { OrderTargets } from './types';

type Range = { min: number; max: number; step: number };

/**
 * How far each full goal can be tuned in onboarding. Minimums are fixed by the product:
 * 1 L of water, up on time, 1 meal, a 15-minute walk.
 */
export const FULL_GOAL_RANGES = {
  water: { min: 2, max: 5, step: 0.5 },
  meal: { min: 1, max: 3, step: 1 },
  workout: { min: 20, max: 90, step: 5 },
} as const satisfies Record<'water' | 'meal' | 'workout', Range>;

export type TunableOrder = keyof typeof FULL_GOAL_RANGES;

export type FullGoals = Record<TunableOrder, number>;

export const DEFAULT_FULL_GOALS: FullGoals = {
  water: DEFAULT_ORDER_TARGETS.water.full,
  meal: DEFAULT_ORDER_TARGETS.meal.full,
  workout: DEFAULT_ORDER_TARGETS.workout.full,
};

/** Wake-up time limits, in minutes after midnight: 4:00 to 9:00 in 15-minute steps. */
export const WAKE_TIME_RANGE: Range = { min: 4 * 60, max: 9 * 60, step: 15 };
export const DEFAULT_WAKE_MINUTES = 6 * 60 + 30;

/** Puts a value inside a range and onto its step grid. Bad numbers fall back to `fallback`. */
export function fitToRange(value: unknown, range: Range, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const clamped = Math.min(range.max, Math.max(range.min, value));
  const steps = Math.round((clamped - range.min) / range.step);
  return roundToHundredths(range.min + steps * range.step);
}

/** The arc's four targets from the tuned full goals. Every value is validated. */
export function buildOrderTargets(fullGoals: Partial<FullGoals>): OrderTargets {
  const water = fitToRange(fullGoals.water, FULL_GOAL_RANGES.water, DEFAULT_FULL_GOALS.water);
  const meal = fitToRange(fullGoals.meal, FULL_GOAL_RANGES.meal, DEFAULT_FULL_GOALS.meal);
  const workout = fitToRange(fullGoals.workout, FULL_GOAL_RANGES.workout, DEFAULT_FULL_GOALS.workout);
  return {
    water: { ...DEFAULT_ORDER_TARGETS.water, full: water },
    wake: DEFAULT_ORDER_TARGETS.wake,
    meal: { ...DEFAULT_ORDER_TARGETS.meal, full: meal },
    workout: { ...DEFAULT_ORDER_TARGETS.workout, full: workout, step: workout },
  };
}
