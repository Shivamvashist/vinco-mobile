import type { Tone } from '@/features/tone';
import { type DayKey, parseDayKey } from '@/lib/dates';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Words used across many screens. */
export const commonCopy = {
  /** Indexed 0 = Sunday to 6 = Saturday, matching Date.getDay(). */
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  months: MONTHS,

  /** "4 December", or "3 January 2027" when the year differs from today's. */
  dayLabel: (day: DayKey, today: DayKey): string => {
    const { year, month, day: date } = parseDayKey(day);
    const label = `${date} ${MONTHS[month - 1] ?? ''}`;
    return year === parseDayKey(today).year ? label : `${label} ${year}`;
  },

  /** "9 October 2026", always with the year. */
  fullDateLabel: (day: DayKey): string => {
    const { year, month, day: date } = parseDayKey(day);
    return `${date} ${MONTHS[month - 1] ?? ''} ${year}`;
  },

  daysLeftInYear: (days: number, year: number): string => {
    if (days <= 0) return `Last day of ${year}`;
    if (days === 1) return `1 day left in ${year}`;
    return `${days} days left in ${year}`;
  },

  /** Name shown for each tone, matching the tone picker. */
  toneNames: {
    philosopher: 'Philosopher',
    centurion: 'Centurion',
    roast: 'Roast me',
  } satisfies Record<Tone, string>,

  toneLabel: (toneName: string): string => `${toneName} tone`,

  /** Shown if the phone's database can't be opened or upgraded at start-up. */
  startupError: {
    title: 'Vinco could not open your data',
    body: 'Your progress is still on this phone. Close Vinco fully and open it again. If this keeps happening, reinstalling an update usually fixes it.',
  },

  /** Screen-reader labels for shared controls. */
  close: 'Close',
  back: 'Back',
  decrease: 'Less',
  increase: 'More',
} as const;
