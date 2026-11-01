import { and, asc, desc, eq, gte, isNotNull, lt, lte } from 'drizzle-orm';

import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
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

/** The query for every day with calories logged between two days, oldest first. Pass to useLiveQuery. */
export function selectCaloriesBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select({ day: dayLogs.day, calories: dayLogs.calories })
    .from(dayLogs)
    .where(and(isNotNull(dayLogs.calories), gte(dayLogs.day, from), lte(dayLogs.day, to)))
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

/**
 * Updates fields on a day's log, creating the row if needed. Setting the selfie, the weight or the
 * calories also stamps when (selfieAt, weightAt, caloriesAt, for the day path), unless the patch
 * gives that time itself; clearing one clears its time.
 */
export function updateDayLog(db: AppDatabase, day: DayKey, patch: DayLogPatch, now: Date = new Date()): void {
  if (Object.keys(patch).length === 0) return;
  const stamped = { ...withLoggedTimes(patch, nowIso(now)), ...patch };
  db.insert(dayLogs)
    .values({ day, ...stamped })
    .onConflictDoUpdate({ target: dayLogs.day, set: stamped })
    .run();
}

/** The logged-at times for the proof values a patch sets: now when set, null when cleared. */
function withLoggedTimes(patch: DayLogPatch, at: string): DayLogPatch {
  const times: DayLogPatch = {};
  if (patch.selfiePath !== undefined) times.selfieAt = patch.selfiePath == null ? null : at;
  if (patch.weightKg !== undefined) times.weightAt = patch.weightKg == null ? null : at;
  if (patch.calories !== undefined) times.caloriesAt = patch.calories == null ? null : at;
  return times;
}
