/**
 * Gloria ("glory points"): experience, derived from the records each time, so an undo takes it
 * back. Only claims store theirs. Pure. See docs/REWARDS.md.
 */
import { addDays, type DayKey } from '@/lib/dates';

import type { JourneyDay } from './journey';

/** What each deed is worth, in one place to tune. */
export const GLORIA = {
  /** An order at its minimum. */
  orderHeld: 10,
  /** An order at its full goal: this much more. */
  orderFull: 5,
  /** Every order at its full goal. */
  dayConquered: 20,
  todoDone: 3,
  /** Each minute of a focus held to the end. */
  focusMinute: 1,
} as const;

/** A day's Gloria by source. */
export type DayGloria = {
  orders: number;
  conquered: number;
  todos: number;
  focus: number;
  claims: number;
  total: number;
};

/** Tint steps for the calendar: 0 none, then three steps up. */
export type GloriaLevel = 0 | 1 | 2 | 3;

/** Where the calendar's tint steps begin. */
export const GLORIA_LEVELS = { low: 1, mid: 40, high: 80 } as const;

/**
 * Glory points for minutes of focus held to the end (which minutes count is the focus rule,
 * heldMinutes in features/focus). The one place the focus rate lives.
 */
export function focusGloria(minutesHeld: number): number {
  if (!Number.isFinite(minutesHeld)) return 0;
  return Math.max(0, Math.round(minutesHeld)) * GLORIA.focusMinute;
}

/** A day's Gloria from its facts. */
export function getDayGloria(day: JourneyDay): DayGloria {
  const held = day.orderStatuses.filter((status) => status !== 'none').length;
  const full = day.orderStatuses.filter((status) => status === 'full').length;
  const orders = held * GLORIA.orderHeld + full * GLORIA.orderFull;
  const conquered = day.result === 'conquered' ? GLORIA.dayConquered : 0;
  const todos = Math.max(0, day.todosDone) * GLORIA.todoDone;
  const focus = focusGloria(day.focusMinutes);
  const claims = Math.max(0, day.claimGloria);
  return { orders, conquered, todos, focus, claims, total: orders + conquered + todos + focus + claims };
}

/** Gloria per day, and the total. */
export function sumGloria(days: Iterable<JourneyDay>): { total: number; byDay: Map<DayKey, number> } {
  const byDay = new Map<DayKey, number>();
  let total = 0;
  for (const day of days) {
    const value = getDayGloria(day).total;
    byDay.set(day.day, value);
    total += value;
  }
  return { total, byDay };
}

/** The calendar's tint step for a day's Gloria. */
export function gloriaLevel(gloria: number): GloriaLevel {
  if (!Number.isFinite(gloria) || gloria < GLORIA_LEVELS.low) return 0;
  if (gloria < GLORIA_LEVELS.mid) return 1;
  if (gloria < GLORIA_LEVELS.high) return 2;
  return 3;
}

/** What a conquered day is worth with this many orders, before to-dos, focus and claims. */
export function conqueredDayGloria(orderCount: number): number {
  const count = Math.max(0, Math.floor(orderCount));
  return count === 0 ? 0 : count * (GLORIA.orderHeld + GLORIA.orderFull) + GLORIA.dayConquered;
}

/** The seven days of a week from its Monday, with each day's Gloria (0 when nothing). */
export function weekGloria(
  weekStart: DayKey,
  byDay: ReadonlyMap<DayKey, number>,
): { day: DayKey; gloria: number }[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    return { day, gloria: byDay.get(day) ?? 0 };
  });
}
