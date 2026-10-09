import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, getDayLog, selectDayLog, selectLatestWeight, selectRecentSelfies, updateDayLog } from '@/db';
import { addDays, type DayKey } from '@/lib/dates';
import { deleteMediaFile } from '@/media';

/** How many recent selfies the strip shows. */
const STRIP_LENGTH = 6;

export type DailySelfie = {
  todayPath: string | null;
  /** The latest selfie before today (usually yesterday's), used as the ghost to line up against. */
  ghostPath: string | null;
  /** Newest first, today included once taken. */
  recent: { day: DayKey; selfiePath: string }[];
  weightKg: number | null;
  /** The most recent weight logged up to today, with its day. */
  latestWeight: { day: DayKey; kg: number } | null;
  /** Saves today's selfie and deletes the photo it replaces. */
  saveSelfie: (path: string) => void;
  saveWeight: (kg: number | null) => void;
};

/** Today's selfie, the ghost, the recent strip and the latest weight, live from the database. */
export function useDailySelfie(today: DayKey): DailySelfie {
  const yesterday = addDays(today, -1);
  const todayLog = useLiveQuery(selectDayLog(db, today), [today]);
  const earlier = useLiveQuery(selectRecentSelfies(db, yesterday, 1), [yesterday]);
  const recent = useLiveQuery(selectRecentSelfies(db, today, STRIP_LENGTH), [today]);
  const latestWeight = useLiveQuery(selectLatestWeight(db, today), [today]);
  const weightRow = latestWeight.data[0];

  return {
    todayPath: todayLog.data[0]?.selfiePath ?? null,
    ghostPath: earlier.data[0]?.selfiePath ?? null,
    recent: recent.data.flatMap((row) =>
      row.selfiePath ? [{ day: row.day, selfiePath: row.selfiePath }] : [],
    ),
    weightKg: todayLog.data[0]?.weightKg ?? null,
    latestWeight: weightRow?.weightKg != null ? { day: weightRow.day, kg: weightRow.weightKg } : null,
    saveSelfie: (path) => {
      const previous = getDayLog(db, today)?.selfiePath ?? null;
      updateDayLog(db, today, { selfiePath: path });
      // Only once the new path is saved: a failed save keeps the old photo.
      if (previous && previous !== path) deleteMediaFile(previous);
    },
    saveWeight: (kg) => updateDayLog(db, today, { weightKg: kg }),
  };
}
