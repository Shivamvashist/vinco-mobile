/**
 * DEV ONLY: going back days on the simulated clock. Days after the new today may already be
 * sealed and hold logs; the rewind removes them in one transaction, so the app never treats a
 * future day as history. Dev panel only: production builds never move the clock.
 */
import { and, desc, eq, gt, inArray, isNotNull } from 'drizzle-orm';

import type { AppDatabase } from '@/db';
import {
  arcOrders,
  arcs,
  claims,
  customOrderLogs,
  customOrders,
  dayLogs,
  focusSessions,
  itemUses,
  ledger,
  orderLogs,
  orderSteps,
  purchases,
  reelDays,
  taskCompletions,
  tasks,
  truces,
} from '@/db/schema';
import { addDays, type DayKey } from '@/lib/dates';

/** Where a rewind lands: the clock's new offset and the day that becomes today. */
export type RewindPlan = { offset: number; newToday: DayKey };

/**
 * The day one step back ('previous') or back on the real clock ('real'), from the app's today and
 * the current offset. Null when the clock is already there (nothing to rewind).
 */
export function planRewind(today: DayKey, offset: number, to: 'previous' | 'real'): RewindPlan | null {
  const current = Math.max(0, Math.floor(offset));
  const next = to === 'previous' ? Math.max(0, current - 1) : 0;
  if (next >= current) return null;
  return { offset: next, newToday: addDays(today, next - current) };
}

/** Why a rewind was refused (nothing changed). */
export class RewindError extends Error {
  readonly reason: 'before_first_arc';

  constructor(reason: 'before_first_arc') {
    super(`Rewind refused: ${reason}`);
    this.name = 'RewindError';
    this.reason = reason;
  }
}

export type RewindResult = {
  /** Selfies of the removed days: the caller deletes the files once the rows are gone. */
  selfiePaths: string[];
  /** A running focus that began after the new today and was removed, so its guard can be lifted. */
  removedRunningFocusId: number | null;
};

/** Seal-time Truce rows on the new today (granted or given back when it was sealed). */
const SEAL_TRUCE_REASONS = ['campaign_week', 'refunded'] as const;

/**
 * Removes every record dated after `newToday` and unseals `newToday` itself (it was sealed when
 * the clock moved past it), in one transaction. Arcs begun after it go with their orders, and the
 * newest arc left becomes active again. Throws RewindError when no arc would be left (use the full
 * reset instead); throws on a database error. Either way nothing changes.
 */
export function rewindJourney(db: AppDatabase, newToday: DayKey): RewindResult {
  const after = gt(dayLogs.day, newToday);
  return db.transaction((tx) => {
    // Arcs begun after the new today: refuse when none would be left.
    const laterArcIds = tx
      .select({ id: arcs.id })
      .from(arcs)
      .where(gt(arcs.startDay, newToday))
      .all()
      .map((row) => row.id);
    const arcCount = tx.select({ id: arcs.id }).from(arcs).all().length;
    if (laterArcIds.length > 0 && laterArcIds.length === arcCount) {
      throw new RewindError('before_first_arc');
    }

    const selfiePaths = tx
      .select({ path: dayLogs.selfiePath })
      .from(dayLogs)
      .where(and(after, isNotNull(dayLogs.selfiePath)))
      .all()
      .flatMap((row) => (row.path ? [row.path] : []));
    const runningLater = tx
      .select({ id: focusSessions.id })
      .from(focusSessions)
      .where(and(gt(focusSessions.day, newToday), eq(focusSessions.status, 'running')))
      .get();

    // Rows keyed by day.
    tx.delete(orderLogs).where(gt(orderLogs.day, newToday)).run();
    tx.delete(orderSteps).where(gt(orderSteps.day, newToday)).run();
    tx.delete(customOrderLogs).where(gt(customOrderLogs.day, newToday)).run();
    tx.delete(dayLogs).where(after).run();
    tx.delete(taskCompletions).where(gt(taskCompletions.day, newToday)).run();
    tx.delete(focusSessions).where(gt(focusSessions.day, newToday)).run();
    tx.delete(claims).where(gt(claims.day, newToday)).run();
    tx.delete(ledger).where(gt(ledger.day, newToday)).run();
    tx.delete(truces).where(gt(truces.day, newToday)).run();
    tx.delete(purchases).where(gt(purchases.day, newToday)).run();
    tx.delete(itemUses).where(gt(itemUses.day, newToday)).run();
    tx.delete(reelDays).where(gt(reelDays.day, newToday)).run();

    // The new today is open again: its seal and the Truces the seal granted or gave back go.
    tx.update(dayLogs).set({ sealedAt: null, result: null }).where(eq(dayLogs.day, newToday)).run();
    tx.delete(truces)
      .where(and(eq(truces.day, newToday), inArray(truces.reason, [...SEAL_TRUCE_REASONS])))
      .run();

    rewindTasks(tx, newToday);
    rewindCustomOrders(tx, newToday, laterArcIds);

    if (laterArcIds.length > 0) {
      tx.delete(arcOrders).where(inArray(arcOrders.arcId, laterArcIds)).run();
      tx.delete(arcs).where(inArray(arcs.id, laterArcIds)).run();
      const isAnyActive = tx.select({ id: arcs.id }).from(arcs).where(eq(arcs.status, 'active')).get();
      const newest = tx.select({ id: arcs.id }).from(arcs).orderBy(desc(arcs.id)).limit(1).get();
      if (!isAnyActive && newest) {
        tx.update(arcs).set({ status: 'active' }).where(eq(arcs.id, newest.id)).run();
      }
    }

    return { selfiePaths, removedRunningFocusId: runningLater?.id ?? null };
  });
}

/**
 * Day tasks carried over to a later day come back to the new today (or their own day, if that is
 * the new today). Tasks dated after the new today are removed with their ticks.
 */
function rewindTasks(tx: AppDatabase, newToday: DayKey): void {
  const later = tx.select().from(tasks).where(gt(tasks.day, newToday)).all();
  const removed: number[] = [];
  for (const task of later) {
    if (task.carriedFrom != null && task.carriedFrom <= newToday) {
      tx.update(tasks)
        .set({ day: newToday, carriedFrom: task.carriedFrom < newToday ? task.carriedFrom : null })
        .where(eq(tasks.id, task.id))
        .run();
    } else {
      removed.push(task.id);
    }
  }
  if (removed.length === 0) return;
  tx.delete(taskCompletions).where(inArray(taskCompletions.taskId, removed)).run();
  tx.delete(tasks).where(inArray(tasks.id, removed)).run();
}

/**
 * Own orders added after the new today go (with their logs), and so do orders of later arcs. A
 * lower goal set on the new today (it starts tomorrow, replacing an order that ends today) stays.
 * Orders stood down or lowered after the new today run on again.
 */
function rewindCustomOrders(tx: AppDatabase, newToday: DayKey, laterArcIds: readonly number[]): void {
  const tomorrow = addDays(newToday, 1);
  const later = tx.select().from(customOrders).where(gt(customOrders.firstDay, newToday)).all();
  const endsToday = new Set(
    tx
      .select({ id: customOrders.id })
      .from(customOrders)
      .where(eq(customOrders.lastDay, newToday))
      .all()
      .map((row) => row.id),
  );
  const removed = later
    .filter(
      (order) => order.firstDay !== tomorrow || order.replacesId == null || !endsToday.has(order.replacesId),
    )
    .map((order) => order.id);
  if (laterArcIds.length > 0) {
    const ofLaterArcs = tx
      .select({ id: customOrders.id })
      .from(customOrders)
      .where(inArray(customOrders.arcId, [...laterArcIds]))
      .all();
    for (const row of ofLaterArcs) if (!removed.includes(row.id)) removed.push(row.id);
  }
  if (removed.length > 0) {
    tx.delete(customOrderLogs).where(inArray(customOrderLogs.orderId, removed)).run();
    tx.delete(customOrders).where(inArray(customOrders.id, removed)).run();
  }
  tx.update(customOrders).set({ lastDay: null }).where(gt(customOrders.lastDay, newToday)).run();
}
