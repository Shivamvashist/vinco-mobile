import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectReelDaysBetween } from '@/db';
import { guardBridge } from '@/features/guard';
import { addDays } from '@/lib/dates';

import { useToday } from './useToday';

export type ReelCount = {
  /** False where reels can't be counted (Expo Go, older builds). */
  canCount: boolean;
  /** Reels counted today (0 before the first). */
  today: number;
  /** Yesterday's count, or null when nothing was kept for it. */
  yesterday: number | null;
  isLoaded: boolean;
};

/**
 * Today's and yesterday's reel counts, from the `reel_days` table that useReelWatch keeps in step
 * with the phone (live: a counted reel updates it while Vinco is open).
 */
export function useReelCount(): ReelCount {
  const today = useToday();
  const yesterday = addDays(today, -1);
  const rows = useLiveQuery(selectReelDaysBetween(db, yesterday, today), [today]);
  const byDay = new Map(rows.data.map((row) => [row.day, row.count]));
  return {
    canCount: guardBridge.canCountReels,
    today: byDay.get(today) ?? 0,
    yesterday: byDay.get(yesterday) ?? null,
    isLoaded: rows.updatedAt !== undefined,
  };
}
