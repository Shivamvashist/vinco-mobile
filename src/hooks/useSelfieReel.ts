import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectSelfiesBetween } from '@/db';
import { arcEndDay } from '@/features/arc';
import type { DayKey } from '@/lib/dates';

/**
 * arc: this campaign's selfies (Today, Vidi). all: every selfie ever taken, across arcs (Vici).
 */
export type ReelScope = 'arc' | 'all';

export type SelfieFrame = { day: DayKey; path: string };

/** The earliest and latest days a reel can cover when it spans everything. */
const ALL_FROM = '0000-01-01';

/** The selfies for a timelapse, oldest first, live from SQLite. */
export function useSelfieReel(
  scope: ReelScope,
  arc: { startDay: DayKey; lengthDays: number } | null,
  today: DayKey,
): { frames: SelfieFrame[]; isLoaded: boolean } {
  const lastArcDay = arc ? arcEndDay(arc.startDay, arc.lengthDays) : today;
  const from = scope === 'arc' && arc ? arc.startDay : ALL_FROM;
  const to = scope === 'arc' && lastArcDay < today ? lastArcDay : today;
  const rows = useLiveQuery(selectSelfiesBetween(db, from, to), [from, to]);
  return {
    frames: rows.data.flatMap((row) => (row.selfiePath ? [{ day: row.day, path: row.selfiePath }] : [])),
    isLoaded: rows.updatedAt !== undefined,
  };
}
