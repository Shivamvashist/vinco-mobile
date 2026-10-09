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
    roast:
      "Your thumb has scrolled a marathon today and your legs haven't left the couch. Pick one order. Any order.",
  },
  {
    philosopher: 'Halfway. The obstacle is the way.',
    centurion: 'Halfway. Keep marching.',
    roast: 'Halfway. Your phone just called its lawyer about custody of your evenings. Keep going.',
  },
  {
    philosopher: 'One order remains. Finish what you started.',
    centurion: 'One left. No excuses, soldier.',
    roast: 'One left. The algorithm is cooking a reel so perfect it should be illegal. Finish first.',
  },
  {
    philosopher: 'All orders held. Rest well, you earned it.',
    centurion: 'Line held. Dismissed.',
    roast:
      'Every order held. Somewhere, an algorithm just lost its favourite customer and is crying in a car park. Same again tomorrow.',
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
    truces: (count: number): string =>
      count === 0 ? 'No Truces' : `${count} ${count === 1 ? 'Truce' : 'Truces'}`,
  },

  /** Shown once every order holds, so the day can be sealed even after the stamp is dismissed. */
  sealCard: {
    heldTitle: 'Line held',
    conqueredTitle: 'Day conquered',
    detail: 'Your day card is ready. Seal it and share the proof.',
    action: 'Seal the day',
  },

  /** Shown while a Truce can still save the campaign (until today ends). */
  truceBanner: {
    title: 'Yesterday fell',
    detail: (campaign: number, days: number): string =>
      `${days === 1 ? 'A Truce' : `${days} Truces`} can still save your ${campaign}-day campaign, until midnight.`,
    action: 'See your options',
  },

  /** The line under the header: [under half held, half or more, one left, all held]. */
  progressLines: PROGRESS_LINES,

  /** The progress line for orders held out of the day's total (any numbers are safe). */
  progressLine(held: number, total: number): ToneLines {
    const remaining = total - held;
    const index = remaining <= 0 ? 3 : remaining === 1 ? 2 : held * 2 >= total ? 1 : 0;
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

  /** The user's own orders on Today. */
  customOrder: {
    /** "10 of 30 pages · minimum held". */
    line: (amount: number, min: number, full: number, unit: string, status: OrderStatus): string => {
      const goal = unit ? `${full} ${unit}` : String(full);
      // A yes-or-no order (minimum equals full goal) has no partial step.
      if (min === full) return status === 'full' ? 'Done · conquered' : unit ? goal : 'Once today';
      if (status === 'full') return `${goal} · conquered`;
      if (status === 'min') return `${amount} of ${goal} · minimum held`;
      return `Hold ${min}, conquer ${goal}`;
    },
    action: (status: OrderStatus, min: number, full: number): string =>
      status === 'none' ? (min === full ? 'Done' : 'Hold') : 'Conquer',
    hint: 'Double tap to move up a level: minimum, then full goal. Long press to go back one.',
  },

  addOrder: 'Add an order',

  /** The to-do tile under the orders. */
  todoTile: {
    title: 'To-do',
    empty: 'Plan your day',
    summary: (done: number, total: number, toCarryOver: number): string => {
      const parts = total > 0 ? [`${done} of ${total} done`] : [];
      if (toCarryOver > 0) parts.push(`${toCarryOver} to carry over`);
      return parts.length > 0 ? parts.join(' · ') : 'Plan your day';
    },
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
    subtitle: 'Every order held. Tomorrow, the same line holds.',
    seal: 'Seal the day',
    back: 'Back to Today',
  },
} as const;
