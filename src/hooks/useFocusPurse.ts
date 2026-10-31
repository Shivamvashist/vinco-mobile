import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectLedger, selectPurchases, selectTruces } from '@/db';

export type FocusPurse = {
  /** Truces held in reserve. */
  truceReserve: number;
  /** Denarii held: earned minus spent. */
  denarii: number;
};

/**
 * What a retreat could be paid with, live: the Truces held and the denarii. Read here rather than
 * from useCampaign, so the focus screens don't need the arc. The retreat itself re-reads both
 * inside its transaction.
 */
export function useFocusPurse(): FocusPurse {
  const truceRows = useLiveQuery(selectTruces(db));
  const ledgerRows = useLiveQuery(selectLedger(db));
  const purchaseRows = useLiveQuery(selectPurchases(db));
  return {
    truceReserve: Math.max(0, sum(truceRows.data.map((row) => row.amount))),
    denarii: sum(ledgerRows.data.map((row) => row.amount)) - sum(purchaseRows.data.map((row) => row.price)),
  };
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}
