import { and, eq } from 'drizzle-orm';

import type { OrderAmounts, OrderKind } from '@/features/orders';
import { EMPTY_ORDER_AMOUNTS, ORDER_KINDS } from '@/features/orders';
import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { type OrderLogRow, orderLogs } from './schema';

/** The query for a day's order logs. Pass to useLiveQuery to re-render on change. */
export function selectOrderLogsForDay(db: AppDatabase, day: DayKey) {
  return db.select().from(orderLogs).where(eq(orderLogs.day, day));
}

/** A day's order logs, read now. */
export function getOrderLogsForDay(db: AppDatabase, day: DayKey): OrderLogRow[] {
  return selectOrderLogsForDay(db, day).all();
}

/** Turns a day's rows into an amount per order. Missing orders count as 0; unknown kinds are ignored. */
export function toOrderAmounts(rows: readonly OrderLogRow[]): OrderAmounts {
  const amounts: OrderAmounts = { ...EMPTY_ORDER_AMOUNTS };
  for (const row of rows) {
    if ((ORDER_KINDS as readonly string[]).includes(row.kind) && Number.isFinite(row.amount)) {
      amounts[row.kind] = row.amount;
    }
  }
  return amounts;
}

/** The workout note for a day, from its rows. */
export function toWorkoutNote(rows: readonly OrderLogRow[]): string {
  return rows.find((row) => row.kind === 'workout')?.note ?? '';
}

/** One order's amount on a day, read now. */
export function getOrderAmount(db: AppDatabase, day: DayKey, kind: OrderKind): number {
  const row = db
    .select({ amount: orderLogs.amount })
    .from(orderLogs)
    .where(and(eq(orderLogs.day, day), eq(orderLogs.kind, kind)))
    .get();
  return row?.amount ?? 0;
}

/** Saves an order's amount (and optionally its note) for a day. Creates the row if needed. */
export function saveOrderAmount(
  db: AppDatabase,
  day: DayKey,
  kind: OrderKind,
  amount: number,
  options: { note?: string; now?: Date } = {},
): void {
  const updatedAt = nowIso(options.now);
  const noteUpdate = options.note === undefined ? {} : { note: options.note };
  db.insert(orderLogs)
    .values({ day, kind, amount, note: options.note ?? '', updatedAt })
    .onConflictDoUpdate({
      target: [orderLogs.day, orderLogs.kind],
      set: { amount, updatedAt, ...noteUpdate },
    })
    .run();
}
