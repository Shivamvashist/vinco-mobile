import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectDayLog, selectRecentSelfies, updateDayLog } from '@/db';
import { addDays, type DayKey } from '@/lib/dates';

/** How many recent selfies the strip shows. */
const STRIP_LENGTH = 6;

export type DailySelfie = {
  todayPath: string | null;
  /** Yesterday's photo, used as the ghost to line up against. */
  ghostPath: string | null;
  /** Newest first, today included once taken. */
  recent: { day: DayKey; selfiePath: string }[];
  weightKg: number | null;
  saveSelfie: (path: string) => void;
  saveWeight: (kg: number | null) => void;
};

/** Today's selfie, yesterday's ghost and the recent strip, live from the database. */
export function useDailySelfie(today: DayKey): DailySelfie {
  const yesterday = addDays(today, -1);
  const todayLog = useLiveQuery(selectDayLog(db, today), [today]);
  const yesterdayLog = useLiveQuery(selectDayLog(db, yesterday), [yesterday]);
  const recent = useLiveQuery(selectRecentSelfies(db, today, STRIP_LENGTH), [today]);

  return {
    todayPath: todayLog.data[0]?.selfiePath ?? null,
    ghostPath: yesterdayLog.data[0]?.selfiePath ?? null,
    recent: recent.data.flatMap((row) =>
      row.selfiePath ? [{ day: row.day, selfiePath: row.selfiePath }] : [],
    ),
    weightKg: todayLog.data[0]?.weightKg ?? null,
    saveSelfie: (path) => updateDayLog(db, today, { selfiePath: path }),
    saveWeight: (kg) => updateDayLog(db, today, { weightKg: kg }),
  };
}
