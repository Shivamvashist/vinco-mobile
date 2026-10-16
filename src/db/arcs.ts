import { and, desc, eq, isNull } from 'drizzle-orm';

import { arcEndDay, type ArcKind, LUDUS_LENGTH_DAYS } from '@/features/arc';
import {
  DEFAULT_ORDER_TARGETS,
  FULL_GOAL_RANGES,
  fitToRange,
  ORDER_KINDS,
  type OrderKind,
  orderKindsIn,
  type OrderTarget,
  type OrderTargets,
  type TunableOrder,
} from '@/features/orders';
import { daysBetween, type DayKey } from '@/lib/dates';

import type { AppDatabase } from './database';
import { type ArcOrderRow, arcOrders, type ArcRow, arcs, customOrderLogs, customOrders } from './schema';
import { grantTruce } from './truces';

export type NewArc = {
  /** Defaults to a campaign. A Ludus ignores lengthDays (it has no end). */
  kind?: ArcKind;
  lengthDays: number;
  startDay: DayKey;
  /** 'HH:MM', 24-hour. */
  wakeTime: string;
  /** The Vinco orders this arc has: all four for a campaign, the user's pick for free training. */
  targets: OrderTargets;
  oathPath: string | null;
};

/**
 * Starts a new arc with its Vinco orders (all four for a campaign), in one transaction. A campaign also gets its starting
 * Truce (a Ludus has nothing to protect). Any arc still active ends first, so there is only ever
 * one active arc: marked finished if it reached its last day, otherwise abandoned.
 * @returns the new arc's id
 */
export function createArc(db: AppDatabase, arc: NewArc): number {
  const kind = arc.kind ?? 'campaign';
  return db.transaction((tx) => {
    endActiveArc(tx, arc.startDay);
    const created = tx
      .insert(arcs)
      .values({
        kind,
        lengthDays: kind === 'ludus' ? LUDUS_LENGTH_DAYS : arc.lengthDays,
        startDay: arc.startDay,
        wakeTime: arc.wakeTime,
        oathPath: arc.oathPath,
      })
      .returning({ id: arcs.id })
      .get();
    const rows = orderKindsIn(arc.targets).map((orderKind) => ({
      arcId: created.id,
      kind: orderKind,
      ...(arc.targets[orderKind] as OrderTarget),
    }));
    if (rows.length > 0) tx.insert(arcOrders).values(rows).run();
    if (kind === 'campaign') grantTruce(tx, arc.startDay, 'arc_start');
    return created.id;
  });
}

/**
 * Ends the active arc, if any: finished when today is past its last day, abandoned otherwise.
 * Records stay (days are kept by date), so the journey's history survives.
 */
export function endActiveArc(db: AppDatabase, today: DayKey): void {
  const active = getActiveArc(db);
  if (!active) return;
  const isFinished =
    active.kind === 'campaign' && daysBetween(arcEndDay(active.startDay, active.lengthDays), today) > 0;
  db.update(arcs)
    .set({ status: isFinished ? 'finished' : 'abandoned' })
    .where(eq(arcs.id, active.id))
    .run();
}

export type NextArc = { kind: ArcKind; lengthDays: number; startDay: DayKey };

/**
 * Moves on from the active arc to a new one starting today: a campaign from the Ludus, the
 * Ludus from a campaign, or another campaign after one ends. Carries over what the user set up
 * (the four orders' goals, the wake-up time, the oath, and their own orders with today's
 * progress), so nothing has to be done twice. One transaction. Throws when there is no arc.
 * @returns the new arc's id
 */
export function startNextArc(db: AppDatabase, next: NextArc, now: Date = new Date()): number {
  return db.transaction((tx) => {
    const current = getActiveArc(tx);
    if (!current) throw new Error('No active arc to move on from.');
    // A campaign always has Vinco's four; free training keeps the orders the user had.
    const carried = toOrderTargets(selectArcOrders(tx, current.id).all(), current.kind);
    const targets = next.kind === 'campaign' ? { ...DEFAULT_ORDER_TARGETS, ...carried } : carried;
    const ownOrders = tx
      .select()
      .from(customOrders)
      .where(and(eq(customOrders.arcId, current.id), isNull(customOrders.lastDay)))
      .all();
    const id = createArc(tx, {
      kind: next.kind,
      lengthDays: next.lengthDays,
      startDay: next.startDay,
      wakeTime: current.wakeTime,
      targets,
      oathPath: current.oathPath,
    });
    const createdAt = now.toISOString();
    for (const order of ownOrders) {
      const copied = tx
        .insert(customOrders)
        .values({
          arcId: id,
          name: order.name,
          unit: order.unit,
          min: order.min,
          full: order.full,
          firstDay: next.startDay,
          createdAt,
        })
        .returning({ id: customOrders.id })
        .get();
      // A lower goal waiting for tomorrow has no log yet: today's progress is on the order it replaces.
      const logOrderId =
        order.firstDay > next.startDay && order.replacesId != null ? order.replacesId : order.id;
      const todayLog = tx
        .select()
        .from(customOrderLogs)
        .where(and(eq(customOrderLogs.orderId, logOrderId), eq(customOrderLogs.day, next.startDay)))
        .get();
      if (todayLog) {
        tx.insert(customOrderLogs)
          .values({ orderId: copied.id, day: next.startDay, amount: todayLog.amount, updatedAt: createdAt })
          .run();
      }
    }
    return id;
  });
}

/** The query for every arc, newest first: the journey's history. Pass to useLiveQuery. */
export function selectAllArcs(db: AppDatabase) {
  return db.select().from(arcs).orderBy(desc(arcs.id));
}

/** The query for the active arc. Pass to useLiveQuery to re-render on change. */
export function selectActiveArc(db: AppDatabase) {
  return db.select().from(arcs).where(eq(arcs.status, 'active')).orderBy(desc(arcs.id)).limit(1);
}

/** The active arc, read now, or undefined before onboarding is finished. */
export function getActiveArc(db: AppDatabase): ArcRow | undefined {
  return selectActiveArc(db).get();
}

/**
 * Changes an arc's planned wake-up time ('HH:MM', 24-hour). Wake-ups already logged keep how
 * they were judged; the new time counts from the next one. Throws on a malformed time.
 */
export function setArcWakeTime(db: AppDatabase, arcId: number, wakeTime: string): void {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(wakeTime)) throw new Error(`Bad wake time: ${wakeTime}`);
  db.update(arcs).set({ wakeTime }).where(eq(arcs.id, arcId)).run();
}

/**
 * Changes the full goal ("Conquer") of one of Vinco's orders, fitted to its tuning range. The
 * minimum is fixed by the product, so holding a day never gets easier; the new goal counts from
 * today. Does nothing if the arc doesn't have that order. A workout's step is its goal.
 */
export function setArcOrderFull(db: AppDatabase, arcId: number, kind: TunableOrder, full: number): void {
  const fitted = fitToRange(full, FULL_GOAL_RANGES[kind], DEFAULT_ORDER_TARGETS[kind].full);
  db.update(arcOrders)
    .set(kind === 'workout' ? { full: fitted, step: fitted } : { full: fitted })
    .where(and(eq(arcOrders.arcId, arcId), eq(arcOrders.kind, kind)))
    .run();
}

/** The query for an arc's orders. Pass to useLiveQuery. */
export function selectArcOrders(db: AppDatabase, arcId: number) {
  return db.select().from(arcOrders).where(eq(arcOrders.arcId, arcId));
}

/**
 * Turns an arc's order rows into targets. A campaign always has all four: missing or broken rows
 * fall back to the defaults. Free training has only the orders it has rows for.
 */
export function toOrderTargets(rows: readonly ArcOrderRow[], kind: ArcKind = 'campaign'): OrderTargets {
  const targets: OrderTargets = kind === 'campaign' ? { ...DEFAULT_ORDER_TARGETS } : {};
  for (const row of rows) {
    const isKnownKind = (ORDER_KINDS as readonly string[]).includes(row.kind);
    const isSane =
      [row.min, row.full, row.step].every(Number.isFinite) &&
      row.min > 0 &&
      row.full >= row.min &&
      row.step > 0;
    if (isKnownKind && isSane) targets[row.kind] = { min: row.min, full: row.full, step: row.step };
  }
  return targets;
}

/**
 * Adds one of Vinco's orders to an arc (free training: picking a suggestion). Counts from today:
 * days already sealed keep their stored result. Does nothing if the arc already has it.
 */
export function addArcOrder(db: AppDatabase, arcId: number, kind: OrderKind, target?: OrderTarget): void {
  db.insert(arcOrders)
    .values({ arcId, kind, ...(target ?? DEFAULT_ORDER_TARGETS[kind]) })
    .onConflictDoNothing()
    .run();
}

/**
 * Removes one of Vinco's orders from a free-training arc. Throws for a campaign, whose four
 * orders are fixed. Logs stay (days are kept by date); sealed days keep their stored result.
 */
export function removeArcOrder(db: AppDatabase, arcId: number, kind: OrderKind): void {
  db.transaction((tx) => {
    const arc = tx.select().from(arcs).where(eq(arcs.id, arcId)).get();
    if (!arc) return;
    if (arc.kind === 'campaign') throw new Error('A campaign keeps its four orders.');
    tx.delete(arcOrders)
      .where(and(eq(arcOrders.arcId, arcId), eq(arcOrders.kind, kind)))
      .run();
  });
}
