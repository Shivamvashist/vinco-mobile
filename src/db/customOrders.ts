import { and, asc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm';

import {
  type CustomOrder,
  type CustomOrderDraft,
  isCustomOrderActiveOn,
  normalizeCustomOrder,
  validateCustomOrder,
} from '@/features/orders';
import { FEATURES } from '@/config/features';
import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { type CustomOrderLogRow, customOrderLogs, type CustomOrderRow, customOrders } from './schema';

/** The query for an arc's own orders, oldest first. Pass to useLiveQuery. */
export function selectCustomOrders(db: AppDatabase, arcId: number) {
  return db.select().from(customOrders).where(eq(customOrders.arcId, arcId)).orderBy(asc(customOrders.id));
}

/** Matches no arc: used while own orders are switched off. */
const NO_ARC_ID = -1;

/**
 * The query for an arc's own orders that count on a day. Pass to useLiveQuery. Every reader
 * of "which own orders count" goes through here, so while the feature is off (FEATURES)
 * this matches nothing and own orders never count toward a day.
 */
export function selectCustomOrdersOn(db: AppDatabase, arcId: number, day: DayKey) {
  const effectiveArcId = FEATURES.customOrders ? arcId : NO_ARC_ID;
  return db
    .select()
    .from(customOrders)
    .where(
      and(
        eq(customOrders.arcId, effectiveArcId),
        lte(customOrders.firstDay, day),
        or(isNull(customOrders.lastDay), gte(customOrders.lastDay, day)),
      ),
    )
    .orderBy(asc(customOrders.id));
}

/** The query for own-order logs between two days. Pass to useLiveQuery. */
export function selectCustomOrderLogsBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select()
    .from(customOrderLogs)
    .where(and(gte(customOrderLogs.day, from), lte(customOrderLogs.day, to)));
}

/** A row as the feature type. */
export function toCustomOrder(row: CustomOrderRow): CustomOrder {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    min: row.min,
    full: row.full,
    firstDay: row.firstDay,
    lastDay: row.lastDay,
  };
}

/** Amount per own order on one day, from log rows. Missing orders count as 0. */
export function toCustomAmounts(rows: readonly CustomOrderLogRow[], day: DayKey): Map<number, number> {
  const amounts = new Map<number, number>();
  for (const row of rows) {
    if (row.day === day && Number.isFinite(row.amount)) amounts.set(row.orderId, row.amount);
  }
  return amounts;
}

/** Why an own order could not be added. */
export class CustomOrderError extends Error {
  readonly reason: NonNullable<ReturnType<typeof validateCustomOrder>>;

  constructor(reason: NonNullable<ReturnType<typeof validateCustomOrder>>) {
    super(`Order refused: ${reason}`);
    this.name = 'CustomOrderError';
    this.reason = reason;
  }
}

/**
 * Adds an own order to an arc. It counts from today. Validates inside the transaction,
 * so two quick saves can't pass the limit. Throws CustomOrderError if refused.
 * @returns the new order's id
 */
export function addCustomOrder(
  db: AppDatabase,
  arcId: number,
  draft: CustomOrderDraft,
  today: DayKey,
): number {
  return db.transaction((tx) => {
    const activeCount = selectCustomOrdersOn(tx, arcId, today)
      .all()
      .filter((row) => row.lastDay == null).length;
    const error = validateCustomOrder(draft, activeCount);
    if (error) throw new CustomOrderError(error);
    const clean = normalizeCustomOrder(draft);
    return tx
      .insert(customOrders)
      .values({ arcId, ...clean, firstDay: today, lastDay: null, createdAt: nowIso() })
      .returning({ id: customOrders.id })
      .get().id;
  });
}

/**
 * Stands an own order down: it still counts today and is gone from tomorrow, so removing
 * an order can never rescue the day in progress. An order added today is removed entirely.
 */
export function standDownCustomOrder(db: AppDatabase, orderId: number, today: DayKey): void {
  db.transaction((tx) => {
    const row = tx.select().from(customOrders).where(eq(customOrders.id, orderId)).get();
    if (!row || !isCustomOrderActiveOn(row, today) || row.lastDay != null) return;
    if (row.firstDay === today) {
      tx.delete(customOrderLogs).where(eq(customOrderLogs.orderId, orderId)).run();
      tx.delete(customOrders).where(eq(customOrders.id, orderId)).run();
      return;
    }
    tx.update(customOrders).set({ lastDay: today }).where(eq(customOrders.id, orderId)).run();
  });
}

/** Saves an own order's amount on a day. Creates the row if needed. */
export function saveCustomOrderAmount(
  db: AppDatabase,
  orderId: number,
  day: DayKey,
  amount: number,
  now: Date = new Date(),
): void {
  const updatedAt = nowIso(now);
  db.insert(customOrderLogs)
    .values({ orderId, day, amount, updatedAt })
    .onConflictDoUpdate({
      target: [customOrderLogs.orderId, customOrderLogs.day],
      set: { amount, updatedAt },
    })
    .run();
}

/** One own order's amount on a day, read now. */
export function getCustomOrderAmount(db: AppDatabase, orderId: number, day: DayKey): number {
  const row = db
    .select({ amount: customOrderLogs.amount })
    .from(customOrderLogs)
    .where(and(eq(customOrderLogs.orderId, orderId), eq(customOrderLogs.day, day)))
    .get();
  return row?.amount ?? 0;
}

/** Own orders with their amounts on a day, read now. */
export function getCustomOrdersWithAmounts(
  db: AppDatabase,
  arcId: number,
  day: DayKey,
): { order: CustomOrder; amount: number }[] {
  const rows = selectCustomOrdersOn(db, arcId, day).all();
  if (rows.length === 0) return [];
  const logs = db
    .select()
    .from(customOrderLogs)
    .where(
      and(
        eq(customOrderLogs.day, day),
        inArray(
          customOrderLogs.orderId,
          rows.map((row) => row.id),
        ),
      ),
    )
    .all();
  const amounts = toCustomAmounts(logs, day);
  return rows.map((row) => ({ order: toCustomOrder(row), amount: amounts.get(row.id) ?? 0 }));
}
