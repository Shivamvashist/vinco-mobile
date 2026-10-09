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

import type { DayResult, LedgerReason, TruceReason } from '@/features/campaign';
import type { OrderKind } from '@/features/orders';
import type { TaskRepeat } from '@/features/tasks';

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
  /** When the user woke (confirmed in the wake sheet; "I'm up"). */
  wokeAt: text('woke_at'),
  /** When the user went to sleep the night before (or after midnight), from the wake sheet. */
  sleptAt: text('slept_at'),
  /** When the VINCO stamp was shown: once per day, when the day is conquered. */
  stampedAt: text('stamped_at'),
  /** The day's selfie in the app's private folder. Never uploaded. */
  selfiePath: text('selfie_path'),
  /** Optional body weight in kg, logged with the selfie. Shown only as a weekly trend. */
  weightKg: real('weight_kg'),
  /** When the day was sealed (Step 9). */
  sealedAt: text('sealed_at'),
  /**
   * The result stored when the day was sealed, so changing orders later never rewrites it.
   * Null before sealing (and for days sealed before this column existed: computed instead).
   */
  result: text('result').$type<Exclude<DayResult, 'truce'>>(),
  /** True once the user called a Truce on this missed day. */
  truceUsed: integer('truce_used', { mode: 'boolean' }).notNull().default(false),
});

/**
 * Denarii, one row per award or spend. (day, reason) is unique, so sealing a day twice
 * can never pay twice. Earned in the app only: never bought with real money.
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

/**
 * Truces in and out, one row per change: +1 when granted, earned or bought, -1 when spent.
 * The reserve is the sum. (day, reason) is unique, so nothing is granted or spent twice.
 */
export const truces = sqliteTable(
  'truces',
  {
    day: text('day').notNull(),
    reason: text('reason').$type<TruceReason>().notNull(),
    amount: integer('amount').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.day, table.reason] })],
);

/** The user's own orders. Active from first_day to last_day (null while active). */
export const customOrders = sqliteTable(
  'custom_orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    arcId: integer('arc_id')
      .notNull()
      .references(() => arcs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    unit: text('unit').notNull().default(''),
    min: integer('min').notNull(),
    full: integer('full').notNull(),
    firstDay: text('first_day').notNull(),
    lastDay: text('last_day'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('custom_orders_arc_idx').on(table.arcId)],
);

/** How far an own order got on a day. One row per order per day. */
export const customOrderLogs = sqliteTable(
  'custom_order_logs',
  {
    orderId: integer('order_id')
      .notNull()
      .references(() => customOrders.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
    amount: integer('amount').notNull().default(0),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.orderId, table.day] }),
    index('custom_order_logs_day_idx').on(table.day),
  ],
);

/** The to-do list: daily tasks (every day to last_day) and day tasks (one day). Never affect sealing. */
export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    repeat: text('repeat').$type<TaskRepeat>().notNull(),
    /** once: the task's day. daily: the first day it shows. */
    day: text('day').notNull(),
    /** daily: the last day it shows. */
    lastDay: text('last_day'),
    /** once: the day it was first planned for, if carried over. */
    carriedFrom: text('carried_from'),
    isDropped: integer('is_dropped', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('tasks_day_idx').on(table.day)],
);

/** A task ticked on a day. One row per task per day. */
export const taskCompletions = sqliteTable(
  'task_completions',
  {
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
    doneAt: text('done_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.day] })],
);

export type ArcRow = typeof arcs.$inferSelect;
export type ArcOrderRow = typeof arcOrders.$inferSelect;
export type OrderLogRow = typeof orderLogs.$inferSelect;
export type DayLogRow = typeof dayLogs.$inferSelect;
export type LedgerRow = typeof ledger.$inferSelect;
export type TruceRow = typeof truces.$inferSelect;
export type CustomOrderRow = typeof customOrders.$inferSelect;
export type CustomOrderLogRow = typeof customOrderLogs.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type TaskCompletionRow = typeof taskCompletions.$inferSelect;
