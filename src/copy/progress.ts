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
    /** Monday first. */
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

  /** The segmented control under the stats. */
  segments: {
    calendar: 'Calendar',
    logs: 'Commentarii',
  },

  /** The Commentarii: Caesar's campaign notes, Vinco's logs. Weight stays neutral in every tone. */
  logs: {
    eyebrow: '"Commentarii" · your campaign notes',
    kinds: { sleep: 'Sleep', water: 'Water', workout: 'Workout', weight: 'Weight' },
    week: (from: string, to: string): string => `${from} to ${to}`,
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    weekdayInitials: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    sleep: {
      title: 'Sleep this week',
      target: (duration: string): string => `Target ${duration}`,
      insight: (average: string, bestDay: string, best: string): string =>
        `Average ${average}. Longest: ${bestDay}, ${best}.`,
      empty: "No sleep logged this week. Tap I'm up each morning and it fills in.",
    },
    water: {
      title: 'Water this week',
      target: (litres: string): string => `Goal ${litres} L`,
      insight: (average: string, atGoal: number, logged: number): string =>
        `Average ${average} L a day. Full goal on ${atGoal} of ${logged} days.`,
      empty: 'No water logged this week yet.',
    },
    workout: {
      title: 'Workout this week',
      target: (minutes: number): string => `Goal ${minutes} min`,
      insight: (total: number, atGoal: number, logged: number): string =>
        `${total} min in all. Full goal on ${atGoal} of ${logged} days.`,
      empty: 'No workouts logged this week yet.',
    },
    weight: {
      title: 'Body weight',
      thisWeek: (kg: string): string => `${kg} kg this week`,
      change: (kg: number): string =>
        kg === 0
          ? 'Same as last week'
          : kg < 0
            ? `Down ${Math.abs(kg)} kg from last week`
            : `Up ${kg} kg from last week`,
      firstWeek: 'Your first week of weigh-ins. The trend shows from next week.',
      noneThisWeek: 'Nothing logged this week yet.',
      empty: 'No weight logged yet. A weekly trend shows once you log a few days.',
      range: (low: string, high: string): string => (low === high ? `${low} kg` : `${low} to ${high} kg`),
      logToday: "Log today's weight",
      updateToday: "Update today's weight",
      chartLabel: (count: number): string => `Weight chart, ${count} ${count === 1 ? 'entry' : 'entries'}`,
    },
    /** Screen reader text for one bar. */
    barLabel: (day: string, value: string | null): string =>
      value ? `${day}, ${value}` : `${day}, not logged`,
  },

  /** Shown until the first day is sealed. */
  emptyLine: {
    philosopher: 'Proof is built one day at a time. Your calendar and selfies will gather here.',
    centurion: 'No proof on record. Seal your first day and it starts here.',
    roast:
      'Proof so far: zero selfies and a screen time report that reads like a hostage note. Seal one day and this fills up.',
  } satisfies ToneLines,
} as const;
