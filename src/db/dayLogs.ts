import { and, desc, eq, isNotNull, lte } from 'drizzle-orm';

import type { DayKey } from '@/lib/dates';

import type { AppDatabase } from './database';
import { type DayLogRow, dayLogs } from './schema';

type DayLogPatch = Partial<Omit<DayLogRow, 'day'>>;

/** The query for one day's log. Pass to useLiveQuery to re-render on change. */
export function selectDayLog(db: AppDatabase, day: DayKey) {
  return db.select().from(dayLogs).where(eq(dayLogs.day, day));
}

/** A day's log, or undefined if nothing has happened that day yet. */
export function getDayLog(db: AppDatabase, day: DayKey): DayLogRow | undefined {
  return selectDayLog(db, day).get();
}

/** The query for the latest days with a selfie, up to and including a day, newest first. */
export function selectRecentSelfies(db: AppDatabase, upTo: DayKey, limit: number) {
  return db
    .select({ day: dayLogs.day, selfiePath: dayLogs.selfiePath })
    .from(dayLogs)
    .where(and(isNotNull(dayLogs.selfiePath), lte(dayLogs.day, upTo)))
    .orderBy(desc(dayLogs.day))
    .limit(Math.max(0, Math.floor(limit)));
}

/** Updates fields on a day's log, creating the row if needed. */
export function updateDayLog(db: AppDatabase, day: DayKey, patch: DayLogPatch): void {
  if (Object.keys(patch).length === 0) return;
  db.insert(dayLogs)
    .values({ day, ...patch })
    .onConflictDoUpdate({ target: dayLogs.day, set: patch })
    .run();
}
