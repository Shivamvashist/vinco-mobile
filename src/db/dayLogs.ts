import { and, asc, desc, eq, gte, isNotNull, lt, lte } from 'drizzle-orm';

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

/** The query for the latest day with a weight, up to and including a day. Pass to useLiveQuery. */
export function selectLatestWeight(db: AppDatabase, upTo: DayKey) {
  return db
    .select({ day: dayLogs.day, weightKg: dayLogs.weightKg })
    .from(dayLogs)
    .where(and(isNotNull(dayLogs.weightKg), lte(dayLogs.day, upTo)))
    .orderBy(desc(dayLogs.day))
    .limit(1);
}

/** The query for every weight logged between two days, oldest first. Pass to useLiveQuery. */
export function selectWeightsBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select({ day: dayLogs.day, weightKg: dayLogs.weightKg })
    .from(dayLogs)
    .where(and(isNotNull(dayLogs.weightKg), gte(dayLogs.day, from), lte(dayLogs.day, to)))
    .orderBy(asc(dayLogs.day));
}

/** The query for every selfie between two days, oldest first: the timelapse frames. */
export function selectSelfiesBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select({ day: dayLogs.day, selfiePath: dayLogs.selfiePath })
    .from(dayLogs)
    .where(and(isNotNull(dayLogs.selfiePath), gte(dayLogs.day, from), lte(dayLogs.day, to)))
    .orderBy(asc(dayLogs.day));
}

/** The query for the latest day with a bedtime, before a day. Pass to useLiveQuery. */
export function selectLatestBedtime(db: AppDatabase, before: DayKey) {
  return db
    .select({ day: dayLogs.day, sleptAt: dayLogs.sleptAt })
    .from(dayLogs)
    .where(and(isNotNull(dayLogs.sleptAt), lt(dayLogs.day, before)))
    .orderBy(desc(dayLogs.day))
    .limit(1);
}

/** Updates fields on a day's log, creating the row if needed. */
export function updateDayLog(db: AppDatabase, day: DayKey, patch: DayLogPatch): void {
  if (Object.keys(patch).length === 0) return;
  db.insert(dayLogs)
    .values({ day, ...patch })
    .onConflictDoUpdate({ target: dayLogs.day, set: patch })
    .run();
}
