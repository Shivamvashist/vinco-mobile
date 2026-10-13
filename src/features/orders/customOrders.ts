import type { DayKey } from '@/lib/dates';

import type { OrderStatus } from './types';

/**
 * The user's own orders: a name, a unit and how many a day ("Water", "glass", 12). Saved with
 * the minimum equal to the full goal, so an own order is simply done or not; orders from before
 * 13 Oct may still have a lower minimum. Every order must hold for the day to be held.
 * See docs/ORDERS-AND-TASKS.md.
 */
export const CUSTOM_ORDER_LIMITS = {
  /** Own orders active at once. */
  maxActive: 6,
  /** Up to this many a day, a tap adds one. Bigger goals (10000 steps) are typed in. */
  maxTapCount: 20,
  nameMaxLength: 40,
  unitMaxLength: 12,
  /** Goals are whole numbers in this range. */
  minGoal: 1,
  maxGoal: 9999,
} as const;

export type CustomOrder = {
  id: number;
  name: string;
  /** "pages", "min", "km". May be empty. */
  unit: string;
  min: number;
  full: number;
  /** The first day it counts. */
  firstDay: DayKey;
  /** The last day it counts, once stood down. Null while active. */
  lastDay: DayKey | null;
};

export type CustomOrderDraft = { name: string; unit: string; min: number; full: number };

export type CustomOrderError = 'nameMissing' | 'goalInvalid' | 'fullBelowMin' | 'tooMany';

/** Whether an own order counts on a day. Day keys sort as text. */
export function isCustomOrderActiveOn(
  order: Pick<CustomOrder, 'firstDay' | 'lastDay'>,
  day: DayKey,
): boolean {
  return order.firstDay <= day && (order.lastDay == null || day <= order.lastDay);
}

/** The first problem with a draft, or null if it can be saved. */
export function validateCustomOrder(draft: CustomOrderDraft, activeCount: number): CustomOrderError | null {
  if (activeCount >= CUSTOM_ORDER_LIMITS.maxActive) return 'tooMany';
  if (draft.name.trim().length === 0) return 'nameMissing';
  const isGoal = (value: number) =>
    Number.isInteger(value) && value >= CUSTOM_ORDER_LIMITS.minGoal && value <= CUSTOM_ORDER_LIMITS.maxGoal;
  if (!isGoal(draft.min) || !isGoal(draft.full)) return 'goalInvalid';
  if (draft.full < draft.min) return 'fullBelowMin';
  return null;
}

/** A draft tidied for saving: trimmed and cut to length. Validate first. */
export function normalizeCustomOrder(draft: CustomOrderDraft): CustomOrderDraft {
  return {
    name: draft.name.trim().replace(/\s+/g, ' ').slice(0, CUSTOM_ORDER_LIMITS.nameMaxLength),
    unit: draft.unit.trim().replace(/\s+/g, ' ').slice(0, CUSTOM_ORDER_LIMITS.unitMaxLength),
    min: draft.min,
    full: draft.full,
  };
}

/** Where an own order's amount stands. */
export function getCustomOrderStatus(amount: number, order: Pick<CustomOrder, 'min' | 'full'>): OrderStatus {
  if (!Number.isFinite(amount) || amount < order.min) return 'none';
  return amount < order.full ? 'min' : 'full';
}

/** A draft from the add form: one number, "how many a day", is both the minimum and the goal. */
export function toCustomOrderDraft(name: string, unit: string, count: number): CustomOrderDraft {
  return { name, unit, min: count, full: count };
}

/** Whether a tap adds one (a small count, like glasses), or the amount is typed in (steps). */
export function isTapCounted(order: Pick<CustomOrder, 'full'>): boolean {
  return order.full <= CUSTOM_ORDER_LIMITS.maxTapCount;
}

/** One tap: one more, up to the goal. */
export function nextCustomAmount(amount: number, order: Pick<CustomOrder, 'min' | 'full'>): number {
  return clampCustomAmount((Number.isFinite(amount) ? amount : 0) + 1, order);
}

/** Long press: one less, never below zero. */
export function previousCustomAmount(amount: number, order: Pick<CustomOrder, 'min' | 'full'>): number {
  return clampCustomAmount((Number.isFinite(amount) ? amount : 0) - 1, order);
}

/** A typed amount kept between 0 and the goal, as a whole number. */
export function clampCustomAmount(amount: number, order: Pick<CustomOrder, 'full'>): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.min(order.full, Math.max(0, Math.round(amount)));
}
