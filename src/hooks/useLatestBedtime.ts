import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectLatestBedtime } from '@/db';
import { clockMinutesOf, getUsableBedtime, SLEEP } from '@/features/sleep';
import { type DayKey, toDayKey } from '@/lib/dates';

import { useNightRest } from './useNightRest';

export type BedtimeDefault = {
  /** Clock minutes. */
  minutes: number;
  /** True when it came from the phone's screen going dark last night. */
  isFromPhone: boolean;
};

/**
 * The bedtime to suggest in the wake sheet, in clock minutes: the phone's own estimate (the
 * screen going dark last night, when the guard service runs), else the last one logged before
 * today, else 11:00 pm. People keep roughly the same bedtime, so this is one tap from correct.
 */
export function useLatestBedtime(today: DayKey): number {
  return useBedtimeDefault(today).minutes;
}

/** The same, saying where it came from (for the wake sheet's "from your screen" line). */
export function useBedtimeDefault(today: DayKey): BedtimeDefault {
  const latest = useLiveQuery(selectLatestBedtime(db, today), [today]);
  const { rest, readAt } = useNightRest();
  // Only for the real today: a dev clock running ahead has no phone night to match.
  const fromPhone = toDayKey(readAt) === today ? getUsableBedtime(rest, readAt) : null;
  if (fromPhone) {
    return { minutes: fromPhone.getHours() * 60 + fromPhone.getMinutes(), isFromPhone: true };
  }
  const logged = clockMinutesOf(latest.data[0]?.sleptAt ?? null);
  return { minutes: logged ?? SLEEP.defaultBedtimeMinutes, isFromPhone: false };
}
