/**
 * Periods for the history charts (the focus log, Gloria): a day, a Monday-first week, a calendar
 * month or a year, as local day keys. Ranges, navigation clamps and bucketing, all pure: day maths
 * goes through lib/dates (UTC midnights of local dates), so daylight saving never shifts a bar.
 */
import { addDays, type DayKey, daysBetween, parseDayKey, shiftMonth, weekdayIndex } from '@/lib/dates';

export type PeriodKind = 'day' | 'week' | 'month' | 'year';

/** A stretch of local days, `start` to `end` inclusive. */
export type Period = { kind: PeriodKind; start: DayKey; end: DayKey };

/** One bar of a period chart: a day (day, week, month views) or a month (year view). */
export type PeriodBucket = { index: number; start: DayKey; end: DayKey };

export type PeriodNavigation = { canGoBack: boolean; canGoForward: boolean };

export const PERIOD_KINDS: readonly PeriodKind[] = ['day', 'week', 'month', 'year'];

/** The Monday that starts the week holding `day`. */
export function mondayOf(day: DayKey): DayKey {
  return addDays(day, -((weekdayIndex(day) + 6) % 7));
}

/** The period of a kind that holds `day`. */
export function periodOf(kind: PeriodKind, day: DayKey): Period {
  switch (kind) {
    case 'day':
      return { kind, start: day, end: day };
    case 'week': {
      const start = mondayOf(day);
      return { kind, start, end: addDays(start, 6) };
    }
    case 'month': {
      const { year, month } = parseDayKey(day);
      return { kind, start: monthStart(year, month), end: monthEnd(year, month) };
    }
    case 'year': {
      const { year } = parseDayKey(day);
      return { kind, start: `${pad(year, 4)}-01-01`, end: `${pad(year, 4)}-12-31` };
    }
  }
}

/** The period `amount` steps after (or before, if negative) this one, of the same kind. */
export function shiftPeriod(period: Period, amount: number): Period {
  const steps = Number.isFinite(amount) ? Math.trunc(amount) : 0;
  switch (period.kind) {
    case 'day':
      return periodOf('day', addDays(period.start, steps));
    case 'week':
      return periodOf('week', addDays(period.start, steps * 7));
    case 'month': {
      const { year, month } = parseDayKey(period.start);
      const next = shiftMonth(year, month, steps);
      return periodOf('month', monthStart(next.year, next.month));
    }
    case 'year': {
      const { year } = parseDayKey(period.start);
      return periodOf('year', `${pad(year + steps, 4)}-01-01`);
    }
  }
}

/** A day kept between the first day with history (if any) and today. */
export function clampDay(day: DayKey, floor: DayKey | null, today: DayKey): DayKey {
  if (day > today) return today;
  if (floor != null && floor <= today && day < floor) return floor;
  return day;
}

/**
 * Whether the navigator can step back (the period starts after the first day with history) and
 * forward (the period ends before today). With no history, there is nowhere to go back to.
 */
export function periodNavigation(period: Period, floor: DayKey | null, today: DayKey): PeriodNavigation {
  return {
    canGoBack: floor != null && period.start > floor,
    canGoForward: period.end < today,
  };
}

/** The bars of a period: one per day (day, week, month) or one per month (year). */
export function periodBuckets(period: Period): PeriodBucket[] {
  if (period.kind === 'year') {
    const { year } = parseDayKey(period.start);
    return Array.from({ length: 12 }, (_, index) => ({
      index,
      start: monthStart(year, index + 1),
      end: monthEnd(year, index + 1),
    }));
  }
  const count = daysBetween(period.start, period.end) + 1;
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    const day = addDays(period.start, index);
    return { index, start: day, end: day };
  });
}

/** Which bar of a period holds `day`, or -1 outside it. */
export function bucketIndexOf(period: Period, day: DayKey): number {
  if (day < period.start || day > period.end) return -1;
  if (period.kind === 'year') return parseDayKey(day).month - 1;
  return daysBetween(period.start, day);
}

/** Whether a day falls inside a period. */
export function isInPeriod(period: Period, day: DayKey): boolean {
  return day >= period.start && day <= period.end;
}

/**
 * Sums items into a period's bars by the day each belongs to. Items outside the period, and
 * values that are not finite numbers, are left out.
 */
export function bucketSums<Item>(
  period: Period,
  items: Iterable<Item>,
  dayOf: (item: Item) => DayKey,
  valueOf: (item: Item) => number,
): number[] {
  const sums = periodBuckets(period).map(() => 0);
  for (const item of items) {
    const index = bucketIndexOf(period, dayOf(item));
    const value = valueOf(item);
    if (index < 0 || !Number.isFinite(value)) continue;
    sums[index] = (sums[index] ?? 0) + value;
  }
  return sums;
}

/** A period's bars from a value per day (Gloria by day): days without a value read 0. */
export function bucketDayValues(period: Period, byDay: ReadonlyMap<DayKey, number>): number[] {
  return bucketSums(
    period,
    byDay.entries(),
    ([day]) => day,
    ([, value]) => value,
  );
}

/**
 * A round number at or above the tallest value, for the top of a chart's scale: 1, 2, 2.5 or 5
 * times a power of ten (47 gives 50, 120 gives 200, 0 gives `floor`). Never below `floor`.
 */
export function niceCeiling(value: number, floor = 1): number {
  const safeFloor = Number.isFinite(floor) && floor > 0 ? floor : 1;
  if (!Number.isFinite(value) || value <= safeFloor) return safeFloor;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * magnitude;
    // Guards float drift like 2.5 * 0.1.
    if (candidate >= value - magnitude * 1e-9) return Number(candidate.toPrecision(12));
  }
  return 10 * magnitude;
}

/** The longest run of consecutive days among `days` (in any order, repeats allowed). */
export function longestDayRun(days: Iterable<DayKey>): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let previous: DayKey | null = null;
  for (const day of sorted) {
    run = previous != null && daysBetween(previous, day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

/**
 * Whether a bar's axis label shows: every bar of a week and a year; on a month, the 1st and every
 * 5th day, so 31 thin bars still read on a narrow phone.
 */
export function shouldLabelBucket(kind: PeriodKind, bucket: PeriodBucket): boolean {
  if (kind !== 'month') return true;
  const { day } = parseDayKey(bucket.start);
  return day === 1 || day % 5 === 0;
}

function monthStart(year: number, month: number): DayKey {
  return `${pad(year, 4)}-${pad(month, 2)}-01`;
}

function monthEnd(year: number, month: number): DayKey {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(days, 2)}`;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}
