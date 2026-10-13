import { roundToHundredths } from '@/lib/progress';

import {
  type AllOrderTargets,
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
export const DEFAULT_ORDER_TARGETS: AllOrderTargets = {
  water: { min: 1, full: 4, step: 1 },
  wake: { min: 1, full: 1, step: 1 },
  meal: { min: 1, full: 2, step: 1 },
  workout: { min: 15, full: 40, step: 40 },
};

export const EMPTY_ORDER_AMOUNTS: OrderAmounts = { water: 0, wake: 0, meal: 0, workout: 0 };

/**
 * The full goal is not a ceiling: going past it is logged (5 L on a 4 L goal). These caps only
 * stop slips and silly numbers. A full goal tuned above its cap raises the cap to match.
 */
export const ORDER_MAX_AMOUNTS: Record<OrderKind, number> = { water: 10, wake: 1, meal: 8, workout: 300 };

/** The most an order can log today: its cap, or its full goal if that is higher. */
export function maxAmountFor(kind: OrderKind, target: OrderTarget): number {
  return Math.max(ORDER_MAX_AMOUNTS[kind], target.full);
}

/** Where an amount stands against its target. */
export function getOrderStatus(amount: number, target: OrderTarget): OrderStatus {
  if (!Number.isFinite(amount) || amount < target.min) return 'none';
  if (amount < target.full) return 'min';
  return 'full';
}

/** One tap: adds a step, never past `max` (the full goal unless a higher cap is given). */
export function addStep(amount: number, target: OrderTarget, max: number = target.full): number {
  return clampAmount(amount + target.step, target, max);
}

/** Long-press undo: removes a step, never below zero. */
export function removeStep(amount: number, target: OrderTarget, max: number = target.full): number {
  return clampAmount(amount - target.step, target, max);
}

/**
 * Keeps an amount between 0 and `max` (the full goal unless a higher cap is given),
 * rounded to avoid floating-point noise.
 */
export function clampAmount(amount: number, target: OrderTarget, max: number = target.full): number {
  if (!Number.isFinite(amount)) return 0;
  return roundToHundredths(Math.min(Math.max(max, target.full), Math.max(0, amount)));
}

/** The Vinco orders an arc has, in Today's order. */
export function orderKindsIn(targets: OrderTargets): OrderKind[] {
  return ORDER_KINDS.filter((kind) => targets[kind] !== undefined);
}

/** An order's goals: the arc's, or the default when the arc doesn't have that order. */
export function targetFor(targets: OrderTargets, kind: OrderKind): OrderTarget {
  return targets[kind] ?? DEFAULT_ORDER_TARGETS[kind];
}

/** The status of every order. Orders the arc doesn't have read as not started (and never count). */
export function getOrderStatuses(
  amounts: OrderAmounts,
  targets: OrderTargets,
): Record<OrderKind, OrderStatus> {
  const statusOf = (kind: OrderKind) => {
    const target = targets[kind];
    return target ? getOrderStatus(amounts[kind], target) : 'none';
  };
  return {
    water: statusOf('water'),
    wake: statusOf('wake'),
    meal: statusOf('meal'),
    workout: statusOf('workout'),
  };
}

/** How many of the arc's Vinco orders are at least at their minimum. */
export function countOrdersHeld(amounts: OrderAmounts, targets: OrderTargets): number {
  const statuses = getOrderStatuses(amounts, targets);
  return orderKindsIn(targets).filter((kind) => statuses[kind] !== 'none').length;
}

/** Every Vinco order the arc has is held (true when it has none: own orders then decide). */
export function areAllOrdersHeld(amounts: OrderAmounts, targets: OrderTargets): boolean {
  return countOrdersHeld(amounts, targets) === orderKindsIn(targets).length;
}

/** Every Vinco order the arc has is at its full goal (true when it has none). */
export function areAllOrdersConquered(amounts: OrderAmounts, targets: OrderTargets): boolean {
  const statuses = getOrderStatuses(amounts, targets);
  return orderKindsIn(targets).every((kind) => statuses[kind] === 'full');
}

/**
 * Orders still open first, conquered ones at the bottom, each group keeping its order. Finishing
 * an order moves it out of the way; undoing brings it back up.
 */
export function sortConqueredLast<Item extends { status: OrderStatus }>(items: readonly Item[]): Item[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aDone = a.item.status === 'full' ? 1 : 0;
      const bDone = b.item.status === 'full' ? 1 : 0;
      return aDone === bDone ? a.index - b.index : aDone - bDone;
    })
    .map(({ item }) => item);
}
