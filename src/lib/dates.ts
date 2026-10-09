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

/** Every day from `from` to `to`, inclusive, in order. Empty if `to` is before `from`. */
export function eachDay(from: DayKey, to: DayKey): DayKey[] {
  const count = daysBetween(from, to) + 1;
  return Array.from({ length: Math.max(0, count) }, (_, index) => addDays(from, index));
}

/** A calendar month as rows of seven, Monday first. Cells outside the month are null. */
export function monthGrid(year: number, month: number): (DayKey | null)[][] {
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  parseDayKey(first); // validates year and month
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = (weekdayIndex(first) + 6) % 7;
  const cells: (DayKey | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => addDays(first, index)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}

/** The month after (or before, if negative) a year and month. */
export function shiftMonth(year: number, month: number, amount: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + amount;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
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

/** A local clock time in 12-hour form, as Indian users read it: "6:34 am", "12:05 pm". */
export function formatClockTime(date: Date): string {
  assertValidDate(date);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours < 12 ? 'am' : 'pm';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${period}`;
}

const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTES_PER_DAY = 24 * 60;

/** Minutes after midnight for a 24-hour 'HH:MM' clock string, or null if malformed. */
export function parseClockMinutes(clock: string): number | null {
  const match = CLOCK_PATTERN.exec(clock);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** A 24-hour 'HH:MM' string for minutes after midnight (wraps around the day). */
export function toClockString(minutes: number): string {
  const safe = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = String(Math.floor(safe / 60)).padStart(2, '0');
  const mins = String(safe % 60).padStart(2, '0');
  return `${hours}:${mins}`;
}

/** Minutes after midnight in 12-hour form: 390 reads "6:30 am". */
export function formatClockMinutes(minutes: number): string {
  const [hours, mins] = toClockString(minutes).split(':').map(Number) as [number, number];
  return formatClockTime(new Date(2000, 0, 1, hours, mins));
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
