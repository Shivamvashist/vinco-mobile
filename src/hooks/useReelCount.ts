import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectReelDaysBetween, selectReelPasses } from '@/db';
import { countReelPasses, getReelAllowanceWithPasses, guardBridge } from '@/features/guard';
import { addDays, type DayKey } from '@/lib/dates';
import { selectDayOffset, useDevStore, useGuardStore } from '@/stores';

import { useToday } from './useToday';

export type ReelCount = {
  /** False where reels can't be counted (Expo Go, older builds). */
  canCount: boolean;
  /** The reel day: the phone's own date (see useReelDay). */
  day: DayKey;
  /** Reels counted today (0 before the first). */
  today: number;
  /** Yesterday's count, or null when nothing was kept for it. */
  yesterday: number | null;
  /** Reel passes used today (0 to 3). */
  passes: number;
  /** Reels allowed today: the budget plus 12 for each pass. */
  allowance: number;
  isLoaded: boolean;
};

/**
 * The day reels are counted on: the phone's own date. The native counter keys counts (and so
 * passes) by the phone's clock, so the dev clock's day offset is taken off here: with the dev
 * calendar ahead, the app's day moves on but the reel day stays the real one. Turns at midnight.
 */
export function useReelDay(): DayKey {
  const today = useToday();
  const dayOffset = useDevStore(selectDayOffset);
  return dayOffset === 0 ? today : addDays(today, -dayOffset);
}

/**
 * Today's and yesterday's reel counts, from the `reel_days` table that useReelWatch keeps in step
 * with the phone (live: a counted reel updates it while Vinco is open), and today's passes.
 */
export function useReelCount(): ReelCount {
  const day = useReelDay();
  const budget = useGuardStore((state) => state.reelBudget);
  const yesterday = addDays(day, -1);
  const rows = useLiveQuery(selectReelDaysBetween(db, yesterday, day), [day]);
  const passRows = useLiveQuery(selectReelPasses(db));
  const byDay = new Map(rows.data.map((row) => [row.day, row.count]));
  const passes = countReelPasses(passRows.data.filter((row) => row.day === day).map((row) => row.reason));
  return {
    canCount: guardBridge.canCountReels,
    day,
    today: byDay.get(day) ?? 0,
    yesterday: byDay.get(yesterday) ?? null,
    passes,
    allowance: getReelAllowanceWithPasses(budget, passes),
    isLoaded: rows.updatedAt !== undefined && passRows.updatedAt !== undefined,
  };
}
