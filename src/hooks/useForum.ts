import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import {
  buyItem,
  db,
  ForumError,
  selectItemUses,
  selectLedger,
  selectPurchases,
  selectTruces,
  toHoldings,
} from '@/db';
import { type ForumItemId, getForumItem, type Holding, type PurchaseCheck } from '@/features/forum';
import { addDays, type DayKey, daysBetween } from '@/lib/dates';

import { useToday } from './useToday';

/** One line of the treasury's history: earned (+) or spent (-). */
export type TreasuryEntry = {
  key: string;
  day: DayKey;
  amount: number;
  /** A ledger reason, or a Forum item. */
  source: { type: 'ledger'; reason: string } | { type: 'purchase'; itemId: ForumItemId };
};

export type Forum = {
  today: DayKey;
  balance: number;
  /** Earned in the last 7 days, today included. */
  earnedThisWeek: number;
  holdings: Record<ForumItemId, Holding>;
  /** Newest first. */
  history: TreasuryEntry[];
  isLoaded: boolean;
  /** Buys an item. Returns null when bought, or why not ('failed' if saving broke). */
  buy: (itemId: ForumItemId) => Exclude<PurchaseCheck, 'ok'> | 'failed' | null;
};

const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);

/** The treasury and the Forum, live from SQLite: balance, what is held, history, and buying. */
export function useForum(): Forum {
  const today = useToday();
  const ledgerRows = useLiveQuery(selectLedger(db));
  const purchaseRows = useLiveQuery(selectPurchases(db));
  const useRows = useLiveQuery(selectItemUses(db));
  const truceRows = useLiveQuery(selectTruces(db));

  const truceReserve = Math.max(0, sum(truceRows.data.map((row) => row.amount)));
  const balance =
    sum(ledgerRows.data.map((row) => row.amount)) - sum(purchaseRows.data.map((row) => row.price));
  const weekStart = addDays(today, -6);
  const earnedThisWeek = sum(
    ledgerRows.data
      .filter(
        (row) => row.amount > 0 && daysBetween(weekStart, row.day) >= 0 && daysBetween(row.day, today) >= 0,
      )
      .map((row) => row.amount),
  );
  const history: TreasuryEntry[] = [
    ...ledgerRows.data.map((row): TreasuryEntry => ({
      key: `l-${row.day}-${row.reason}`,
      day: row.day,
      amount: row.amount,
      source: { type: 'ledger', reason: row.reason },
    })),
    ...purchaseRows.data.map((row): TreasuryEntry => ({
      key: `p-${row.id}`,
      day: row.day,
      amount: -row.price,
      source: { type: 'purchase', itemId: row.itemId },
    })),
  ].sort((a, b) => (a.day === b.day ? a.key.localeCompare(b.key) : a.day < b.day ? 1 : -1));

  return {
    today,
    balance,
    earnedThisWeek,
    holdings: toHoldings(purchaseRows.data, useRows.data, truceReserve, today),
    history,
    isLoaded:
      ledgerRows.updatedAt !== undefined &&
      purchaseRows.updatedAt !== undefined &&
      useRows.updatedAt !== undefined &&
      truceRows.updatedAt !== undefined,
    buy: (itemId) => {
      try {
        getForumItem(itemId);
        buyItem(db, itemId, today);
        return null;
      } catch (error) {
        if (error instanceof ForumError) return error.reason;
        if (__DEV__) console.warn('[forum] Could not buy.', error);
        return 'failed';
      }
    },
  };
}
