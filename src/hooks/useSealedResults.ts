import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectSealedResults } from '@/db';
import { findFirstDay } from '@/features/arc';
import type { DayKey } from '@/lib/dates';

export type SealedResults = {
  /** Every sealed day's stored result, across all arcs (a Truce is not applied here). */
  results: ReadonlyMap<DayKey, 'conquered' | 'held' | 'missed'>;
  /** The first sealed day of the whole journey, or null before any. */
  firstDay: DayKey | null;
  isLoaded: boolean;
};

/** Every sealed day of the journey, live: lets the calendar reach back past the current arc. */
export function useSealedResults(): SealedResults {
  const query = useLiveQuery(selectSealedResults(db));
  const rows = query.data.flatMap((row) => (row.result ? [{ day: row.day, result: row.result }] : []));
  return {
    results: new Map(rows.map((row) => [row.day, row.result])),
    firstDay: findFirstDay(rows.map((row) => row.day)),
    isLoaded: query.updatedAt !== undefined,
  };
}
