import { and, asc, gte, lte, ne } from 'drizzle-orm';

import type { ReelDay } from '@/features/guard';
import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { reelDays } from './schema';

/**
 * Copies the phone's reel counts into the table, in one transaction. The native module is the
 * source of truth, so each day takes the native count as it is (a row is only written when it
 * changed). Days the module no longer keeps stay as they were.
 */
export function saveReelDays(db: AppDatabase, days: readonly ReelDay[], now: Date = new Date()): void {
  if (days.length === 0) return;
  const updatedAt = nowIso(now);
  db.transaction((tx) => {
    for (const { day, count } of days) {
      tx.insert(reelDays)
        .values({ day, count, updatedAt })
        .onConflictDoUpdate({
          target: reelDays.day,
          set: { count, updatedAt },
          // Skips the write (and a live-query refresh) when the stored count is already right.
          setWhere: ne(reelDays.count, count),
        })
        .run();
    }
  });
}

/** The days between `from` and `to` (inclusive) that have a row, oldest first. */
export function selectReelDaysBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select()
    .from(reelDays)
    .where(and(gte(reelDays.day, from), lte(reelDays.day, to)))
    .orderBy(asc(reelDays.day));
}
