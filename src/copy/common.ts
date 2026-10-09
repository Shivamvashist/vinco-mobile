import type { Tone } from '@/features/tone';

/** Words used across many screens. */
export const commonCopy = {
  /** Indexed 0 = Sunday to 6 = Saturday, matching Date.getDay(). */
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

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
} as const;
