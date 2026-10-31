import { type DayKey, parseDayKey } from '@/lib/dates';

export type YearMonth = { year: number; month: number };

export type CalendarRange = { first: YearMonth; last: YearMonth };

/**
 * The months the progress calendar can show: back to the first month with a sealed record or
 * the arc's start, whichever is earlier, and forward to this month. A record dated after today
 * (the dev clock moved back) never pushes the range past this month.
 */
export function getCalendarRange(
  arcStartDay: DayKey,
  firstRecordDay: DayKey | null,
  today: DayKey,
): CalendarRange {
  const last = toYearMonth(today);
  const starts = [toYearMonth(arcStartDay), ...(firstRecordDay ? [toYearMonth(firstRecordDay)] : [])];
  const earliest = starts.reduce((a, b) => (compareMonths(b, a) < 0 ? b : a));
  // An arc that starts next month (dev clock) still opens on this month.
  return { first: compareMonths(earliest, last) > 0 ? last : earliest, last };
}

/** The earliest day key in a list, or null when it is empty. Day keys sort as text. */
export function findFirstDay(days: readonly DayKey[]): DayKey | null {
  let first: DayKey | null = null;
  for (const day of days) if (first == null || day < first) first = day;
  return first;
}

/** Negative when a is before b, 0 when the same month, positive after. */
export function compareMonths(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

/** A month kept inside a range. */
export function clampMonth(month: YearMonth, range: CalendarRange): YearMonth {
  if (compareMonths(month, range.first) < 0) return range.first;
  if (compareMonths(month, range.last) > 0) return range.last;
  return month;
}

export function toYearMonth(day: DayKey): YearMonth {
  const { year, month } = parseDayKey(day);
  return { year, month };
}
