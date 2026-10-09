/**
 * The phone's database (SQLite through Drizzle). Records live here, never in Zustand.
 *
 * Conventions: tables plural and snake_case; days are local day keys ('YYYY-MM-DD');
 * moments are ISO timestamps; nothing derivable (like an order's status) is stored,
 * so it can never disagree with the amounts it comes from.
 *
 * After changing this file: npm run db:generate, and commit the new migration.
 */
import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { LedgerReason } from '@/features/campaign';
import type { OrderKind } from '@/features/orders';

/** A 30, 60 or 90 day campaign. One is active at a time. */
export const arcs = sqliteTable(
  'arcs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    lengthDays: integer('length_days').notNull(),
    /** Day I of the arc. */
    startDay: text('start_day').notNull(),
    /** Planned wake-up time, 'HH:MM' in 24-hour form. Conquering wake-up means being up by then. */
    wakeTime: text('wake_time').notNull().default('06:30'),
    /** The oath recording in the app's private folder, or null if skipped. */
    oathPath: text('oath_path'),
    status: text('status', { enum: ['active', 'finished', 'abandoned'] })
      .notNull()
      .default('active'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [index('arcs_status_idx').on(table.status)],
);

/** The four orders' goals for an arc, as tuned in onboarding. */
export const arcOrders = sqliteTable(
  'arc_orders',
  {
    arcId: integer('arc_id')
      .notNull()
      .references(() => arcs.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<OrderKind>().notNull(),
    min: real('min').notNull(),
    full: real('full').notNull(),
    step: real('step').notNull(),
  },
  (table) => [primaryKey({ columns: [table.arcId, table.kind] })],
);

/** How far each order got on a day. One row per day per order, written as the user taps. */
export const orderLogs = sqliteTable(
  'order_logs',
  {
    day: text('day').notNull(),
    kind: text('kind').$type<OrderKind>().notNull(),
    amount: real('amount').notNull().default(0),
    /** Workout note; empty for other orders. */
    note: text('note').notNull().default(''),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.day, table.kind] })],
);

/** One row per day: the facts about the day itself. */
export const dayLogs = sqliteTable('day_logs', {
  day: text('day').primaryKey(),
  /** When "I'm up" was tapped. */
  wokeAt: text('woke_at'),
  /** When the VINCO stamp was shown. It shows once per day. */
  stampedAt: text('stamped_at'),
  /** The day's selfie in the app's private folder. Never uploaded. */
  selfiePath: text('selfie_path'),
  /** Optional body weight in kg, logged with the selfie. Shown only as a weekly trend. */
  weightKg: real('weight_kg'),
  /** When the day was sealed (Step 9). */
  sealedAt: text('sealed_at'),
  truceUsed: integer('truce_used', { mode: 'boolean' }).notNull().default(false),
});

/**
 * Denarii earned, one row per award. (day, reason) is unique, so sealing a day twice
 * can never pay twice. Earned only: nothing here is ever bought.
 */
export const ledger = sqliteTable(
  'ledger',
  {
    day: text('day').notNull(),
    reason: text('reason').$type<LedgerReason>().notNull(),
    amount: integer('amount').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.day, table.reason] })],
);

export type ArcRow = typeof arcs.$inferSelect;
export type ArcOrderRow = typeof arcOrders.$inferSelect;
export type OrderLogRow = typeof orderLogs.$inferSelect;
export type DayLogRow = typeof dayLogs.$inferSelect;
export type LedgerRow = typeof ledger.$inferSelect;
