import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectLedger, selectPurchases, selectTruces } from '@/db';

import { useGloria } from './useGloria';

export type HudCounts = {
  /** Denarii held: earned minus spent. */
  denarii: number;
  /** Gloria (glory points) on the whole journey. */
  gloria: number;
  /** Truces held in reserve. */
  truces: number;
  isLoaded: boolean;
};

const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);

/** The three counters at the top of each tab, live from the records. Read only. */
export function useHudCounts(): HudCounts {
  const ledgerRows = useLiveQuery(selectLedger(db));
  const purchaseRows = useLiveQuery(selectPurchases(db));
  const truceRows = useLiveQuery(selectTruces(db));
  const gloria = useGloria();
  return {
    denarii: sum(ledgerRows.data.map((row) => row.amount)) - sum(purchaseRows.data.map((row) => row.price)),
    gloria: gloria.total,
    truces: Math.max(0, sum(truceRows.data.map((row) => row.amount))),
    isLoaded:
      gloria.isLoaded &&
      ledgerRows.updatedAt !== undefined &&
      purchaseRows.updatedAt !== undefined &&
      truceRows.updatedAt !== undefined,
  };
}
