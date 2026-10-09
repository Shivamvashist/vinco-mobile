import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { type ArcRow, db, selectActiveArc, selectArcOrders, toOrderTargets } from '@/db';
import { DEFAULT_ORDER_TARGETS, type OrderTargets } from '@/features/orders';

/** Never matches a real arc: used to query nothing until the arc is known. */
const NO_ARC_ID = -1;

export type ActiveArc = {
  /** The current arc, or null before onboarding is finished. */
  arc: ArcRow | null;
  /** The arc's tuned orders, or the defaults when there is no arc. */
  targets: OrderTargets;
  isLoaded: boolean;
};

/** The active arc and its orders, kept live: re-renders when either changes. */
export function useActiveArc(): ActiveArc {
  const arcQuery = useLiveQuery(selectActiveArc(db));
  const arc = arcQuery.data[0] ?? null;
  const ordersQuery = useLiveQuery(selectArcOrders(db, arc?.id ?? NO_ARC_ID), [arc?.id]);

  return {
    arc,
    targets: arc ? toOrderTargets(ordersQuery.data) : DEFAULT_ORDER_TARGETS,
    isLoaded: arcQuery.updatedAt !== undefined && ordersQuery.updatedAt !== undefined,
  };
}
