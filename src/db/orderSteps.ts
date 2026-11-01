import { and, asc, eq, gt } from 'drizzle-orm';

import { orderStepKey } from '@/features/dayPath';
import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { orderSteps } from './schema';

/** The step key for an own order: Vinco's orders use their kind ('water'). */
export function ownOrderStepKey(orderId: number): string {
  return orderStepKey(orderId);
}

/** The query for a day's order steps, oldest first. Pass to useLiveQuery. */
export function selectOrderStepsForDay(db: AppDatabase, day: DayKey) {
  return db.select().from(orderSteps).where(eq(orderSteps.day, day)).orderBy(asc(orderSteps.id));
}

/**
 * Keeps an order's steps in line with its new amount: a rise adds one step (when it happened and
 * the amount reached), a fall deletes the steps above the new amount. No change, no row.
 * Called by the order savers inside their write, so every path that logs an order records it.
 */
export function recordOrderStep(
  db: AppDatabase,
  day: DayKey,
  orderKey: string,
  before: number,
  after: number,
  now: Date = new Date(),
): void {
  if (!Number.isFinite(before) || !Number.isFinite(after) || after === before) return;
  if (after > before) {
    db.insert(orderSteps)
      .values({ day, orderKey, amount: after, at: nowIso(now) })
      .run();
    return;
  }
  db.delete(orderSteps)
    .where(and(eq(orderSteps.day, day), eq(orderSteps.orderKey, orderKey), gt(orderSteps.amount, after)))
    .run();
}

/** Deletes every step of one order (an own order deleted with its logs). */
export function deleteOrderSteps(db: AppDatabase, orderKey: string): void {
  db.delete(orderSteps).where(eq(orderSteps.orderKey, orderKey)).run();
}
