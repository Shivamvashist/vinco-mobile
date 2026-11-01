/**
 * Gloria through time (the /gloria screen): a period's bars and total, and one day's Gloria split
 * by where it came from. Pure. See docs/REWARDS.md, section 5.
 */
import { bucketDayValues, type Period } from '@/features/periods';
import type { DayKey } from '@/lib/dates';

import type { DayGloria } from './gloria';

/** Where a day's Gloria comes from, in the order the day view lists them. */
export type GloriaSource = Exclude<keyof DayGloria, 'total'>;

export const GLORIA_SOURCES: readonly GloriaSource[] = ['orders', 'conquered', 'todos', 'focus', 'claims'];

/** A period's Gloria per bar (a day, or a month in the year view), and its total. */
export function gloriaPeriod(
  byDay: ReadonlyMap<DayKey, number>,
  period: Period,
): { bars: number[]; total: number } {
  const bars = bucketDayValues(period, byDay).map((value) => Math.max(0, value));
  return { bars, total: bars.reduce((sum, value) => sum + value, 0) };
}

/** A day's Gloria by source, in display order, leaving out sources that gave nothing. */
export function gloriaParts(day: DayGloria): { source: GloriaSource; value: number }[] {
  return GLORIA_SOURCES.map((source) => ({ source, value: Math.max(0, day[source]) })).filter(
    (part) => part.value > 0,
  );
}
