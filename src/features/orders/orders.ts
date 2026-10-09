import { roundToHundredths } from '@/lib/progress';

import {
  ORDER_KINDS,
  type OrderAmounts,
  type OrderKind,
  type OrderStatus,
  type OrderTarget,
  type OrderTargets,
} from './types';

/**
 * Default orders from the product plan, used until onboarding lets the user tune them.
 * Workout: 15 minutes holds the line, 40 conquers.
 */
export const DEFAULT_ORDER_TARGETS: OrderTargets = {
  water: { min: 1, full: 4, step: 1 },
  wake: { min: 1, full: 1, step: 1 },
  meal: { min: 1, full: 2, step: 1 },
  workout: { min: 15, full: 40, step: 40 },
};

export const EMPTY_ORDER_AMOUNTS: OrderAmounts = { water: 0, wake: 0, meal: 0, workout: 0 };

/** Where an amount stands against its target. */
export function getOrderStatus(amount: number, target: OrderTarget): OrderStatus {
  if (!Number.isFinite(amount) || amount < target.min) return 'none';
  if (amount < target.full) return 'min';
  return 'full';
}

/** One tap: adds a step, never past the full goal. */
export function addStep(amount: number, target: OrderTarget): number {
  return clampAmount(amount + target.step, target);
}

/** Long-press undo: removes a step, never below zero. */
export function removeStep(amount: number, target: OrderTarget): number {
  return clampAmount(amount - target.step, target);
}

/** Keeps an amount between 0 and the full goal, rounded to avoid floating-point noise. */
export function clampAmount(amount: number, target: OrderTarget): number {
  if (!Number.isFinite(amount)) return 0;
  return roundToHundredths(Math.min(target.full, Math.max(0, amount)));
}

/** The status of every order. */
export function getOrderStatuses(
  amounts: OrderAmounts,
  targets: OrderTargets,
): Record<OrderKind, OrderStatus> {
  return {
    water: getOrderStatus(amounts.water, targets.water),
    wake: getOrderStatus(amounts.wake, targets.wake),
    meal: getOrderStatus(amounts.meal, targets.meal),
    workout: getOrderStatus(amounts.workout, targets.workout),
  };
}

/** How many orders are at least at their minimum (0 to 4). */
export function countOrdersHeld(amounts: OrderAmounts, targets: OrderTargets): number {
  const statuses = getOrderStatuses(amounts, targets);
  return ORDER_KINDS.filter((kind) => statuses[kind] !== 'none').length;
}

/** All four orders held: the day can be sealed and the VINCO stamp lands. */
export function areAllOrdersHeld(amounts: OrderAmounts, targets: OrderTargets): boolean {
  return countOrdersHeld(amounts, targets) === ORDER_KINDS.length;
}

/** All four orders at their full goal. */
export function areAllOrdersConquered(amounts: OrderAmounts, targets: OrderTargets): boolean {
  const statuses = getOrderStatuses(amounts, targets);
  return ORDER_KINDS.every((kind) => statuses[kind] === 'full');
}
