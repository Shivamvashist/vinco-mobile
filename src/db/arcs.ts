import { and, desc, eq, isNull } from 'drizzle-orm';

import { arcEndDay, type ArcKind, LUDUS_LENGTH_DAYS } from '@/features/arc';
import { DEFAULT_ORDER_TARGETS, ORDER_KINDS, type OrderTargets } from '@/features/orders';
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
  targets: OrderTargets;
  oathPath: string | null;
};

/**
 * Starts a new arc with its four orders, in one transaction. A campaign also gets its starting
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
    tx.insert(arcOrders)
      .values(ORDER_KINDS.map((kind) => ({ arcId: created.id, kind, ...arc.targets[kind] })))
      .run();
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
    const targets = toOrderTargets(selectArcOrders(tx, current.id).all());
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
      const todayLog = tx
        .select()
        .from(customOrderLogs)
        .where(and(eq(customOrderLogs.orderId, order.id), eq(customOrderLogs.day, next.startDay)))
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

/** The query for an arc's orders. Pass to useLiveQuery. */
export function selectArcOrders(db: AppDatabase, arcId: number) {
  return db.select().from(arcOrders).where(eq(arcOrders.arcId, arcId));
}

/** Turns an arc's order rows into targets. Missing or broken rows fall back to the defaults. */
export function toOrderTargets(rows: readonly ArcOrderRow[]): OrderTargets {
  const targets: OrderTargets = { ...DEFAULT_ORDER_TARGETS };
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
