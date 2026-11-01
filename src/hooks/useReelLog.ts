import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import {
  buyReelPass,
  db,
  ReelPassError,
  selectLedger,
  selectPurchases,
  selectReelDays,
  selectReelPasses,
} from '@/db';
import { isReelPassReason, type ReelDay, type ReelPassCheck } from '@/features/guard';
import type { DayKey } from '@/lib/dates';

export type ReelLog = {
  /** Every kept day, oldest first. */
  days: ReelDay[];
  /** Passes used per day. */
  passesByDay: ReadonlyMap<DayKey, number>;
  /** Denarii held now. */
  balance: number;
  isLoaded: boolean;
  /**
   * Buys a pass for `day`. `seenPasses` is the count the user confirmed against (a double tap
   * buys once). Returns null when bought (or already bought), or why not.
   */
  buyPass: (day: DayKey, seenPasses: number) => Exclude<ReelPassCheck, 'ok'> | 'failed' | null;
};

const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);

/** The reel log for /reels: the kept days, the passes and the purse, live from SQLite. */
export function useReelLog(): ReelLog {
  const dayRows = useLiveQuery(selectReelDays(db));
  const passRows = useLiveQuery(selectReelPasses(db));
  const ledgerRows = useLiveQuery(selectLedger(db));
  const purchaseRows = useLiveQuery(selectPurchases(db));

  const passesByDay = new Map<DayKey, number>();
  for (const row of passRows.data) {
    if (isReelPassReason(row.reason)) passesByDay.set(row.day, (passesByDay.get(row.day) ?? 0) + 1);
  }

  return {
    days: dayRows.data.map((row) => ({ day: row.day, count: row.count })),
    passesByDay,
    balance: sum(ledgerRows.data.map((row) => row.amount)) - sum(purchaseRows.data.map((row) => row.price)),
    isLoaded:
      dayRows.updatedAt !== undefined &&
      passRows.updatedAt !== undefined &&
      ledgerRows.updatedAt !== undefined &&
      purchaseRows.updatedAt !== undefined,
    buyPass: (day, seenPasses) => {
      try {
        buyReelPass(db, day, seenPasses);
        return null;
      } catch (error) {
        if (error instanceof ReelPassError) return error.reason;
        if (__DEV__) console.warn('[reels] Could not buy a reel pass.', error);
        return 'failed';
      }
    },
  };
}
