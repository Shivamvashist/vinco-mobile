import { mondayOf } from '@/features/periods';
import { addDays, type DayKey } from '@/lib/dates';

import { getReelAllowanceWithPasses } from './reelPass';
import type { ReelDay } from './reels';

/**
 * The reel log's two views (the /reels screen): Day shows a bar a day for a Monday-first week;
 * Week shows a bar a week for the last eight weeks. Pure: the screen passes the kept days.
 */
export type ReelLogView = 'day' | 'week';

/** Weeks in the Week view. */
export const REEL_WEEKS_SHOWN = 8;

/** A stretch of days, `start` to `end` inclusive, as one bar. */
export type ReelSpan = { start: DayKey; end: DayKey };

/** What the log shows: its bars' spans and the range they cover. */
export type ReelRange = { view: ReelLogView; start: DayKey; end: DayKey; spans: ReelSpan[] };

/** The range of a view that holds `day`: its week (Day), or eight weeks ending with its week (Week). */
export function reelRangeOf(view: ReelLogView, day: DayKey): ReelRange {
  const monday = mondayOf(day);
  if (view === 'day') {
    const spans = Array.from({ length: 7 }, (_, index) => {
      const at = addDays(monday, index);
      return { start: at, end: at };
    });
    return { view, start: monday, end: addDays(monday, 6), spans };
  }
  const first = addDays(monday, -7 * (REEL_WEEKS_SHOWN - 1));
  const spans = Array.from({ length: REEL_WEEKS_SHOWN }, (_, index) => {
    const start = addDays(first, index * 7);
    return { start, end: addDays(start, 6) };
  });
  return { view, start: first, end: addDays(monday, 6), spans };
}

/** The range `steps` ranges before (negative) or after this one, of the same view. */
export function shiftReelRange(range: ReelRange, steps: number): ReelRange {
  const whole = Number.isFinite(steps) ? Math.trunc(steps) : 0;
  const days = range.view === 'day' ? 7 : 7 * REEL_WEEKS_SHOWN;
  return reelRangeOf(range.view, addDays(range.end, whole * days));
}

/** One bar: reels within the day's allowance, and over it. */
export type ReelBarValue = { within: number; over: number; total: number };

/**
 * The bars of a range. Each day splits at its own allowance (the budget now, plus the passes used
 * that day); a week adds up its days. Days without a count read 0.
 */
export function reelBarValues(
  range: ReelRange,
  days: readonly ReelDay[],
  budget: number,
  passesByDay: ReadonlyMap<DayKey, number>,
): ReelBarValue[] {
  const byDay = new Map(days.map((item) => [item.day, item.count]));
  return range.spans.map((span) => {
    let within = 0;
    let over = 0;
    for (let day = span.start; day <= span.end; day = addDays(day, 1)) {
      const count = byDay.get(day) ?? 0;
      if (!Number.isFinite(count) || count <= 0) continue;
      const allowance = getReelAllowanceWithPasses(budget, passesByDay.get(day) ?? 0);
      within += Math.min(count, allowance);
      over += Math.max(0, count - allowance);
    }
    return { within, over, total: within + over };
  });
}

/** The budget line for a view: a day's budget, or seven of them for a week. */
export function reelReferenceValue(view: ReelLogView, budget: number): number {
  return view === 'day' ? budget : budget * 7;
}

/** The first day with a count, or null when nothing is kept yet. */
export function firstReelDay(days: readonly ReelDay[]): DayKey | null {
  let first: DayKey | null = null;
  for (const item of days) if (first == null || item.day < first) first = item.day;
  return first;
}

/** Whether the log can step back (history before the range) and forward (the range ends before today). */
export function reelRangeNavigation(
  range: ReelRange,
  firstDay: DayKey | null,
  today: DayKey,
): { canGoBack: boolean; canGoForward: boolean } {
  return { canGoBack: firstDay != null && firstDay < range.start, canGoForward: range.end < today };
}
