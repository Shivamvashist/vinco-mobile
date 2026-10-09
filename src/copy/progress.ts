import { tabsCopy } from './tabs';
import type { ToneLines } from './toneLines';

/** The Vidi (Progress) tab. */
export const progressCopy = {
  eyebrow: `${tabsCopy.vidi.latin} · ${tabsCopy.vidi.meaning}`,
  title: 'Your proof',

  stats: {
    campaign: 'Campaign',
    fullGoalDays: 'Full-goal days',
    daysToGo: 'Days to go',
  },

  calendar: {
    /** Monday first, matching the Truce week. */
    weekdayInitials: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    legend: {
      conquered: 'Conquered',
      held: 'Line held',
      truce: 'Truce',
      missed: 'Missed',
    },
    /** What a screen reader says for a day cell. */
    dayLabel: (date: string, status: string): string => (status ? `${date}, ${status}` : date),
    statusWords: {
      conquered: 'conquered',
      held: 'line held',
      truce: 'Truce',
      missed: 'missed',
      today: 'today',
      future: 'still to come',
      outside: '',
    },
  },

  timelapse: {
    title: 'Timelapse',
    count: (selfies: number, needed: number): string => `${Math.min(selfies, needed)} of ${needed} selfies`,
    unlocks: (dayRoman: string): string => `Your first timelapse unlocks on Day ${dayRoman}.`,
    ready: 'Enough selfies for your first timelapse. Making it arrives in an update.',
  },

  /** Shown until the first day is sealed. */
  emptyLine: {
    philosopher: 'Proof is built one day at a time. Your calendar and selfies will gather here.',
    centurion: 'No proof on record. Seal your first day and it starts here.',
    roast: 'Current proof: zero selfies and a lot of confidence. Seal one day and this starts filling up.',
  } satisfies ToneLines,
} as const;
