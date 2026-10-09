import { addDays, type DayKey, parseDayKey } from '@/lib/dates';

/**
 * Sleep, logged with "I'm up": the user confirms when they woke and when they went to sleep.
 * Times are clock minutes (after midnight); a bedtime later in the clock than the wake time
 * means the night before. See docs/DAY-FLOW.md.
 */
export const SLEEP = {
  /** First-time default bedtime: 11:00 pm. */
  defaultBedtimeMinutes: 23 * 60,
  /** The sleep goal on the chart: 7 h 30 m. */
  targetMinutes: 7 * 60 + 30,
  /** Under this, the chart marks the night as short (porphyry). */
  shortMinutes: 6 * 60,
  /** Shortest and longest sleep accepted. Anything outside is almost surely a typo. */
  minMinutes: 60,
  maxMinutes: 16 * 60,
  /** A wake time this far past the clock is still accepted (phones drift, people round). */
  futureGraceMinutes: 5,
} as const;

const MINUTES_PER_DAY = 24 * 60;

/** Minutes slept from a bedtime to a wake time, both clock minutes. Crosses midnight when needed. */
export function sleepMinutesBetween(bedtimeMinutes: number, wakeMinutes: number): number {
  const diff = (wakeMinutes - bedtimeMinutes) % MINUTES_PER_DAY;
  return diff <= 0 ? diff + MINUTES_PER_DAY : diff;
}

export type WakeError = 'tooShort' | 'tooLong' | 'inFuture';

/**
 * The problem with a wake report, or null if it can be saved.
 * @param nowMinutes the clock now, or null when the day isn't the real today (no future check)
 */
export function validateWake(
  bedtimeMinutes: number,
  wakeMinutes: number,
  nowMinutes: number | null,
): WakeError | null {
  if (nowMinutes != null && wakeMinutes > nowMinutes + SLEEP.futureGraceMinutes) return 'inFuture';
  const slept = sleepMinutesBetween(bedtimeMinutes, wakeMinutes);
  if (slept < SLEEP.minMinutes) return 'tooShort';
  if (slept > SLEEP.maxMinutes) return 'tooLong';
  return null;
}

/** A local Date on a day at a clock time. */
export function atClock(day: DayKey, minutes: number): Date {
  const { year, month, day: date } = parseDayKey(day);
  return new Date(year, month - 1, date, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

/**
 * The wake and bed moments for a wake report on a day. The bedtime falls on the same day when
 * it is earlier in the clock than waking (after midnight), otherwise on the day before.
 */
export function toWakeMoments(
  day: DayKey,
  bedtimeMinutes: number,
  wakeMinutes: number,
): { wokeAt: Date; sleptAt: Date } {
  const bedDay = bedtimeMinutes < wakeMinutes ? day : addDays(day, -1);
  return { wokeAt: atClock(day, wakeMinutes), sleptAt: atClock(bedDay, bedtimeMinutes) };
}

/** Minutes slept between two saved moments, or null if either is missing or broken. */
export function sleepMinutesFromMoments(sleptAt: string | null, wokeAt: string | null): number | null {
  if (!sleptAt || !wokeAt) return null;
  const minutes = Math.round((new Date(wokeAt).getTime() - new Date(sleptAt).getTime()) / 60000);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

/** Clock minutes of a saved moment, or null. */
export function clockMinutesOf(iso: string | null): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.getHours() * 60 + date.getMinutes();
}
