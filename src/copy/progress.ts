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
    daysTrained: 'Days trained',
    selfies: 'Selfies',
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
      rest: 'day off',
      today: 'today',
      future: 'still to come',
      outside: '',
    },
  },

  timelapse: {
    title: 'Timelapse',
    count: (selfies: number, needed: number): string => `${Math.min(selfies, needed)} of ${needed} selfies`,
    unlocks: (dayRoman: string): string => `Your first timelapse unlocks on Day ${dayRoman}.`,
    ready: 'Enough selfies for your first full timelapse. Saving it as a video arrives in an update.',
    play: 'Play the timelapse',
  },

  /** The segmented control under the stats. */
  segments: {
    calendar: 'Calendar',
    logs: 'Commentarii',
  },

  /** The Commentarii: Caesar's campaign notes, Vinco's logs. Weight stays neutral in every tone. */
  logs: {
    eyebrow: '"Commentarii" · your campaign notes',
    kinds: { sleep: 'Sleep', water: 'Water', workout: 'Workout', weight: 'Body' },
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
    /** The body chart: weight and calories, each line can be hidden. */
    body: {
      title: 'Weight and calories',
      lines: { weight: 'Weight', calories: 'Calories' },
      caloriesRange: (low: string, high: string): string =>
        low === high ? `${low} kcal` : `${low} to ${high} kcal`,
      caloriesEmpty: 'Log calories from Today and they show here beside your weight.',
      allHidden: 'Both lines are hidden. Tap one above to show it.',
      chartLabel: (weights: number, calories: number): string =>
        `Body chart, ${weights} weigh-ins and ${calories} days of calories`,
    },
    /** Screen reader text for one bar. */
    barLabel: (day: string, value: string | null): string =>
      value ? `${day}, ${value}` : `${day}, not logged`,
  },

  /** The sheet that opens when a calendar day is tapped: a summary of that day. */
  daySheet: {
    status: {
      conquered: 'Conquered',
      held: 'Line held',
      truce: 'Truce',
      missed: 'Missed',
      open: 'In progress',
    },
    /** Free training has no streak: a missed day is just a day off. */
    restDay: 'Day off',
    ordersTitle: 'Orders',
    noOrders: 'No orders that day.',
    water: (litres: string, full: string): string => `${litres} of ${full} L`,
    meal: (amount: number, full: number): string => `${amount} of ${full} ${full === 1 ? 'meal' : 'meals'}`,
    workout: (minutes: number, full: number): string => `${minutes} of ${full} min`,
    wake: (isUp: boolean): string => (isUp ? 'Up' : 'Not logged'),
    own: (amount: number, full: number, unit: string): string =>
      `${amount} of ${full}${unit ? ` ${unit}` : ''}`,
    bodyTitle: 'Body and rest',
    sleep: 'Sleep',
    wokeAt: (time: string): string => `Up at ${time}`,
    weight: 'Weight',
    calories: 'Calories',
    notLogged: 'Not logged',
    tasks: (count: number): string =>
      count === 0 ? 'No to-dos ticked' : `${count} ${count === 1 ? 'to-do' : 'to-dos'} ticked`,
    selfieLabel: (date: string): string => `Selfie from ${date}`,
    noSelfie: 'No selfie',
    hint: 'Opens a summary of the day',
  },

  /** Shown until the first day is sealed. */
  emptyLine: {
    philosopher: 'Proof is built one day at a time. Your calendar and selfies will gather here.',
    centurion: 'No proof on record. Seal your first day and it starts here.',
    roast:
      'Proof so far: zero selfies and a screen time report that reads like a hostage note. Seal one day and this fills up.',
  } satisfies ToneLines,
} as const;
