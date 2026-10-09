/**
 * Calendar-day helpers. Vinco thinks in local calendar days ("2026-10-17"), not timestamps,
 * so a day is the same day wherever the clock or daylight saving moves.
 * Day maths uses UTC midnights of the local dates, which never shift with daylight saving.
 */

/** A local calendar date as 'YYYY-MM-DD'. */
export type DayKey = string;

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The local calendar day of a moment. */
export function toDayKey(date: Date): DayKey {
  assertValidDate(date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Reads a day key back into its parts.
 * @throws Error for malformed keys and impossible dates like 2026-02-30.
 */
export function parseDayKey(key: DayKey): { year: number; month: number; day: number } {
  const match = DAY_KEY_PATTERN.exec(key);
  const [year, month, day] = [Number(match?.[1]), Number(match?.[2]), Number(match?.[3])];
  if (!match || !isRealDate(year, month, day)) throw new Error(`Invalid day key: "${key}"`);
  return { year, month, day };
}

/** Whole calendar days from one day to another. Negative if `to` is earlier. */
export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((toUtcMidnight(to) - toUtcMidnight(from)) / DAY_MS);
}

/** The day key `amount` days after (or before, if negative) a given day. */
export function addDays(key: DayKey, amount: number): DayKey {
  const date = new Date(toUtcMidnight(key) + amount * DAY_MS);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/** Days remaining in the year after today: 17 October 2026 gives 75, 31 December gives 0. */
export function daysLeftInYear(today: DayKey): number {
  const { year } = parseDayKey(today);
  return daysBetween(today, `${year}-12-31`);
}

/**
 * Which day of the arc today is, starting at 1 on the start day.
 * Returns 0 before the arc starts. Not capped at the arc length: callers decide what "finished" means.
 */
export function dayOfArc(startDay: DayKey, today: DayKey): number {
  return Math.max(0, daysBetween(startDay, today) + 1);
}

/** Day of the week, 0 = Sunday to 6 = Saturday, for a day key. */
export function weekdayIndex(key: DayKey): number {
  return new Date(toUtcMidnight(key)).getUTCDay();
}

/** Milliseconds until the next local midnight. Used to roll the day over while the app is open. */
export function msUntilNextLocalMidnight(now: Date): number {
  assertValidDate(now);
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}

function toUtcMidnight(key: DayKey): number {
  const { year, month, day } = parseDayKey(key);
  return Date.UTC(year, month - 1, day);
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function assertValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) throw new Error('Invalid Date');
}
