import type { DayKey } from '@/lib/dates';

import type { OrderStatus } from './types';

/**
 * The user's own orders. Same rule as Vinco's four: a minimum holds the line, a full goal
 * conquers, and every order must hold for the day to be held. See docs/ORDERS-AND-TASKS.md.
 */
export const CUSTOM_ORDER_LIMITS = {
  /** Own orders active at once (eight orders in all with Vinco's four). */
  maxActive: 4,
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

/** One tap: not started, then the minimum, then the full goal. */
export function nextCustomAmount(amount: number, order: Pick<CustomOrder, 'min' | 'full'>): number {
  const status = getCustomOrderStatus(amount, order);
  return status === 'none' ? order.min : order.full;
}

/** Long press: back down a level. */
export function previousCustomAmount(amount: number, order: Pick<CustomOrder, 'min' | 'full'>): number {
  const status = getCustomOrderStatus(amount, order);
  return status === 'full' && order.full > order.min ? order.min : 0;
}
