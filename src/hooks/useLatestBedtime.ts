import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectLatestBedtime } from '@/db';
import { clockMinutesOf, SLEEP } from '@/features/sleep';
import type { DayKey } from '@/lib/dates';

/**
 * The bedtime to suggest in the wake sheet: the last one logged before today, as clock
 * minutes, or 11:00 pm the first time. People keep roughly the same bedtime, so this is
 * usually right and one tap away from correct.
 */
export function useLatestBedtime(today: DayKey): number {
  const latest = useLiveQuery(selectLatestBedtime(db, today), [today]);
  return clockMinutesOf(latest.data[0]?.sleptAt ?? null) ?? SLEEP.defaultBedtimeMinutes;
}
