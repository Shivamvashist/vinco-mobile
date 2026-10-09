import { desc, eq } from 'drizzle-orm';

import { DEFAULT_ORDER_TARGETS, ORDER_KINDS, type OrderTargets } from '@/features/orders';
import type { DayKey } from '@/lib/dates';

import type { AppDatabase } from './database';
import { type ArcOrderRow, arcOrders, type ArcRow, arcs } from './schema';

export type NewArc = {
  lengthDays: number;
  startDay: DayKey;
  /** 'HH:MM', 24-hour. */
  wakeTime: string;
  targets: OrderTargets;
  oathPath: string | null;
};

/**
 * Starts a new arc with its four orders, in one transaction.
 * Any arc still active is marked abandoned first, so there is only ever one active arc.
 * @returns the new arc's id
 */
export function createArc(db: AppDatabase, arc: NewArc): number {
  return db.transaction((tx) => {
    tx.update(arcs).set({ status: 'abandoned' }).where(eq(arcs.status, 'active')).run();
    const created = tx
      .insert(arcs)
      .values({
        lengthDays: arc.lengthDays,
        startDay: arc.startDay,
        wakeTime: arc.wakeTime,
        oathPath: arc.oathPath,
      })
      .returning({ id: arcs.id })
      .get();
    tx.insert(arcOrders)
      .values(ORDER_KINDS.map((kind) => ({ arcId: created.id, kind, ...arc.targets[kind] })))
      .run();
    return created.id;
  });
}

/** The query for the active arc. Pass to useLiveQuery to re-render on change. */
export function selectActiveArc(db: AppDatabase) {
  return db.select().from(arcs).where(eq(arcs.status, 'active')).orderBy(desc(arcs.id)).limit(1);
}

/** The active arc, read now, or undefined before onboarding is finished. */
export function getActiveArc(db: AppDatabase): ArcRow | undefined {
  return selectActiveArc(db).get();
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
