import type { OrderKind, OrderStatus } from '@/features/orders';

import { tabsCopy } from './tabs';
import type { ToneLines } from './toneLines';

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/** Litres shown without trailing zeros: 2, 2.5. */
const litres = (value: number): string => `${Number(value.toFixed(2))}`;

/** The line under the Today header, by how many orders are held. */
const PROGRESS_LINES = [
  {
    philosopher: 'Small things done well make the day. Begin with one.',
    centurion: 'Orders are posted. Move.',
    roast: 'Your water bottle has been staring at you all morning. Go on, pick it up.',
  },
  {
    philosopher: 'Halfway. The obstacle is the way.',
    centurion: 'Two down. Keep marching.',
    roast: 'Halfway there. Your phone is getting nervous. Keep going.',
  },
  {
    philosopher: 'One order remains. Finish what you started.',
    centurion: 'One left. No excuses, soldier.',
    roast: 'One left. Finish it before your phone finds you.',
  },
  {
    philosopher: 'All orders held. Rest well, you earned it.',
    centurion: 'Line held. Dismissed.',
    roast: 'Look at you. Productive. Suspicious, honestly. Same again tomorrow.',
  },
] as const satisfies readonly [ToneLines, ToneLines, ToneLines, ToneLines];

/** The Veni (Today) tab. */
export const todayCopy = {
  eyebrow: `${tabsCopy.veni.latin} · ${tabsCopy.veni.meaning}`,
  ordersSection: 'Your orders',
  /** "Day XII of LX" (shown in caps). */
  arcEyebrow: (dayRoman: string, lengthRoman: string): string => `Day ${dayRoman} of ${lengthRoman}`,
  arcFinishedEyebrow: 'Arc complete',

  chips: {
    campaign: (days: number): string => `Campaign ${days}`,
    truceReady: 'Truce ready',
    truceUsed: 'Truce used this week',
  },

  /** The line under the header: [0 or 1 held, 2 held, 3 held, all 4 held]. */
  progressLines: PROGRESS_LINES,

  /** The progress line for a number of orders held (any number is safe). */
  progressLine(held: number): ToneLines {
    const index = held >= 4 ? 3 : held === 3 ? 2 : held === 2 ? 1 : 0;
    return PROGRESS_LINES[index];
  },

  saveError: 'That last change could not be saved. Try again; nothing else was lost.',

  ringLabel: (held: number, total: number): string => `${held} of ${total} orders held`,

  orders: {
    water: {
      name: 'Water',
      action: '+1 L',
      line: (amount: number, full: number, status: OrderStatus): string => {
        if (status === 'full') return `${litres(full)} of ${litres(full)} L · conquered`;
        const progress = `${litres(amount)} of ${litres(full)} L`;
        return status === 'min' ? `${progress} · minimum held` : progress;
      },
      hint: 'Double tap to add a litre. Long press to undo one.',
    },
    wake: {
      name: 'Wake-up',
      action: "I'm up",
      idleLine: 'Tap when you are out of bed',
      doneLine: (time: string): string => `Up at ${time}`,
      hint: 'Double tap when you are up. Long press to undo.',
    },
    meal: {
      name: 'Protein meal',
      action: '+1',
      line: (amount: number, full: number, status: OrderStatus): string => {
        if (status === 'full') return `${full} of ${full} ${plural(full, 'meal', 'meals')} · conquered`;
        const progress = `${amount} of ${full} ${plural(full, 'meal', 'meals')}`;
        return status === 'min' ? `${progress} · minimum held` : progress;
      },
      hint: 'Double tap to add a meal. Long press to undo one.',
    },
    workout: {
      name: 'Workout',
      action: 'Log',
      idleLine: (full: number): string => `${full} min · tap to log`,
      doneLine: (minutes: number, status: OrderStatus, note: string): string => {
        const base = status === 'full' ? `${minutes} min · conquered` : `${minutes} min · line held`;
        return note ? `${base} · ${note}` : base;
      },
      hint: 'Double tap to log your workout. Long press to undo.',
    },
  } satisfies Record<OrderKind, object>,

  statusWords: {
    none: 'not started',
    min: 'minimum held',
    full: 'conquered',
  },

  workoutSheet: {
    title: 'What did you train?',
    subtitle: 'Pick what you did. A few words help you see the pattern later.',
    holdTitle: 'Hold the line',
    holdDescription: (minutes: number): string => `${minutes} min walk or a short home set`,
    conquerTitle: 'Conquer',
    conquerDescription: (minutes: number): string => `${minutes} min, gym or home`,
    noteLabel: 'Note (optional)',
    notePlaceholder: 'Push day. Bench 3 sets, shoulder press.',
    save: 'Log workout',
    cancel: 'Not yet',
  },

  stamp: {
    stampText: 'VINCO',
    title: 'Day conquered',
    titleWithDay: (romanDay: string): string => `Day ${romanDay} conquered`,
    subtitle: 'All four orders held. Tomorrow, the same line holds.',
    seal: 'Seal the day',
    back: 'Back to Today',
  },
} as const;
