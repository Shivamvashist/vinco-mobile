import { and, gte, lte } from 'drizzle-orm';

import { FEATURES } from '@/config/features';
import type { JourneyArc, JourneyInput } from '@/features/gloria';
import type { DayKey } from '@/lib/dates';

import { toOrderTargets } from './arcs';
import type { AppDatabase } from './database';
import {
  type ArcOrderRow,
  type ArcRow,
  arcOrders,
  arcs,
  claims,
  customOrderLogs,
  customOrders,
  dayLogs,
  focusSessions,
  ledger,
  orderLogs,
  taskCompletions,
} from './schema';

/**
 * The rows the journey's days are built from (features/gloria, buildJourneyDays), between two
 * days. Each select is also a live query for the hooks; loadJourneyInput reads them at once for
 * a claim's check. Focus sessions are read only (Step E owns their writes).
 */
export function selectAllArcOrders(db: AppDatabase) {
  return db.select().from(arcOrders);
}

/** Live query: every arc, oldest first. */
export function selectArcsForJourney(db: AppDatabase) {
  return db.select().from(arcs);
}

/** Live query: every own order of every arc (filtered per day by the journey). */
export function selectAllCustomOrders(db: AppDatabase) {
  return db.select().from(customOrders);
}

/** Live query: focus sessions begun between two days. */
export function selectFocusSessionsBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select()
    .from(focusSessions)
    .where(and(gte(focusSessions.day, from), lte(focusSessions.day, to)));
}

/** Live query: claims made between two days. */
export function selectClaimsBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select()
    .from(claims)
    .where(and(gte(claims.day, from), lte(claims.day, to)));
}

/** Live query: ledger rows (denarii in and out) between two days. */
export function selectLedgerBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select()
    .from(ledger)
    .where(and(gte(ledger.day, from), lte(ledger.day, to)));
}

/** Live query: every claim. */
export function selectClaims(db: AppDatabase) {
  return db.select().from(claims);
}

/** Arcs with their Vinco orders' targets, as the journey reads them. */
export function toJourneyArcs(arcRows: readonly ArcRow[], orderRows: readonly ArcOrderRow[]): JourneyArc[] {
  return arcRows.map((arc) => ({
    id: arc.id,
    startDay: arc.startDay,
    lengthDays: arc.lengthDays,
    wakeTime: arc.wakeTime,
    targets: toOrderTargets(
      orderRows.filter((row) => row.arcId === arc.id),
      arc.kind,
    ),
  }));
}

type JourneyRows = Omit<JourneyInput, 'arcs' | 'customOrders'> & {
  arcRows: readonly ArcRow[];
  arcOrderRows: readonly ArcOrderRow[];
  customOrders: JourneyInput['customOrders'];
};

/** The journey's input from its rows. Own orders count only while the feature is on (FEATURES). */
export function toJourneyInput(rows: JourneyRows): JourneyInput {
  return {
    arcs: toJourneyArcs(rows.arcRows, rows.arcOrderRows),
    orderLogs: rows.orderLogs,
    customOrders: FEATURES.customOrders ? rows.customOrders : [],
    customLogs: rows.customLogs,
    dayLogs: rows.dayLogs,
    taskCompletions: rows.taskCompletions,
    focusSessions: rows.focusSessions,
    claims: rows.claims,
  };
}

/** The journey's input between two days, read now (inside a claim's transaction). */
export function loadJourneyInput(db: AppDatabase, from: DayKey, to: DayKey): JourneyInput {
  return toJourneyInput({
    arcRows: selectArcsForJourney(db).all(),
    arcOrderRows: selectAllArcOrders(db).all(),
    customOrders: selectAllCustomOrders(db).all(),
    orderLogs: db
      .select()
      .from(orderLogs)
      .where(and(gte(orderLogs.day, from), lte(orderLogs.day, to)))
      .all(),
    customLogs: db
      .select()
      .from(customOrderLogs)
      .where(and(gte(customOrderLogs.day, from), lte(customOrderLogs.day, to)))
      .all(),
    dayLogs: db
      .select()
      .from(dayLogs)
      .where(and(gte(dayLogs.day, from), lte(dayLogs.day, to)))
      .all(),
    taskCompletions: db
      .select()
      .from(taskCompletions)
      .where(and(gte(taskCompletions.day, from), lte(taskCompletions.day, to)))
      .all(),
    focusSessions: selectFocusSessionsBetween(db, from, to).all(),
    claims: selectClaimsBetween(db, from, to).all(),
  });
}
