import type { CustomOrderMode, OrderKind, OrderStatus } from '@/features/orders';

import { tabsCopy } from './tabs';

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/** Litres shown without trailing zeros: 2, 2.5. */
const litres = (value: number): string => `${Number(value.toFixed(2))}`;

/** The Veni (Today) tab. */
export const todayCopy = {
  eyebrow: `${tabsCopy.veni.latin} · ${tabsCopy.veni.meaning}`,
  ordersSection: 'Your orders',
  /** One quiet line under the orders heading: how to log and how to take a step back. */
  ordersHint: 'Tap to log. Press and hold to take one back.',
  /** "Day XII of LX" (shown in caps). */
  arcEyebrow: (dayRoman: string, lengthRoman: string): string => `Day ${dayRoman} of ${lengthRoman}`,
  arcFinishedEyebrow: 'Arc complete',
  /** "Free training · Day XII" (shown in caps): counts days, with no end. */
  ludusEyebrow: (dayRoman: string): string => `Free training · Day ${dayRoman}`,
  /** After a campaign's last day: the way on, from Today. */
  finished: {
    title: 'Campaign complete',
    body: 'You finished what you started. Begin another campaign, or switch to free training.',
    action: 'Choose what next',
  },

  chips: {
    campaign: (days: number): string => `Campaign ${days}`,
    /** Free training has no streak: it counts the days trained instead. */
    trained: (days: number): string => `${days} ${days === 1 ? 'day' : 'days'} trained`,
    denarii: (amount: number): string => `${amount} denarii`,
    denariiHint: 'Opens the Forum',
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

  saveError: 'That last change could not be saved. Try again; nothing else was lost.',

  ringLabel: (held: number, total: number): string => `${held} of ${total} orders held`,
  /** Beside the orders heading: "2 of 5 done". */
  ordersCount: (done: number, total: number): string => `${done} of ${total} done`,
  menuLabel: 'Open your menu',

  /** The quick logs under the header: loud until done today, then small. */
  quickLogs: {
    selfie: 'Selfie',
    selfieDone: 'Selfie taken',
    selfieHint: "Opens the camera for today's selfie",
    weight: 'Weight',
    weightDone: (kg: string): string => `${kg} kg`,
    weightHint: "Logs today's weight",
    calories: 'Calories',
    caloriesDone: (kcal: string): string => `${kcal} kcal`,
    caloriesHint: "Logs today's calories",
  },

  /** Free training has no streak to lose: just a nudge to keep a run of full days going. */
  run: {
    chip: (days: number): string => `${days}-day run`,
    nudge: (days: number): string => `Finish today's orders to keep your ${days}-day run going.`,
    start: 'Finish every order today to start a run.',
  },

  /** Free training with no orders yet: one suggestion, and a way to add your own. */
  noOrders: {
    title: 'No orders yet',
    body: 'Start with water, a litre at a time. Add anything else you will do every day.',
    waterName: 'Water',
    waterLine: 'A litre at a time, up to 4 L',
    add: 'Add',
    added: 'Added',
  },

  orders: {
    water: {
      name: 'Water',
      action: '+1 L',
      line: (amount: number, full: number, status: OrderStatus): string => {
        if (status === 'full' && amount > full)
          return `${litres(amount)} L · conquered, ${litres(amount - full)} over`;
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
      doneLine: (time: string, sleep: string | null): string =>
        sleep ? `Up at ${time} · ${sleep} sleep` : `Up at ${time}`,
      hint: 'Double tap to change your wake and sleep times. Long press to undo.',
    },
    meal: {
      name: 'Protein meal',
      action: '+1',
      line: (amount: number, full: number, status: OrderStatus): string => {
        if (status === 'full' && amount > full)
          return `${amount} ${plural(amount, 'meal', 'meals')} · conquered, ${amount - full} over`;
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

  /** Before wake-up is logged, Today opens on the dawn card. */
  dawn: {
    eyebrow: '"Surgo" · I rise',
    greeting: (hour: number): string =>
      hour < 5 ? 'Up early' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening',
    planned: (time: string): string => `Planned wake-up: ${time}`,
    action: "I'm up",
    waiting: "Your orders open once you're up.",
  },

  /** A sick day: a Truce called in advance. Neutral in every tone (it's a health moment). */
  sickDay: {
    dawnAction: 'Feeling sick today',
    sheetTitle: 'Feeling sick?',
    sheetBody:
      'Call a Truce for today and rest. Your campaign stays safe even if you do nothing. Hold every order anyway and the Truce comes back at midnight.',
    fromReserve: (reserve: number): string =>
      `Uses 1 of your ${reserve} ${reserve === 1 ? 'Truce' : 'Truces'}.`,
    bought: (cost: number, denarii: number): string =>
      `No Truces left: this one costs ${cost} denarii (you have ${denarii}).`,
    cannotAfford: (cost: number, denarii: number): string =>
      `No Truces left, and one costs ${cost} denarii (you have ${denarii}). Rest anyway, and hold the minimum if you can.`,
    confirm: 'Call a sick-day Truce',
    cancel: "I'll push through",
    failed: "The Truce couldn't be called. Nothing was spent. Try again.",
    cardEyebrow: 'Sick day · Truce called',
    cardTitle: 'Rest and recover',
    cardBody:
      'Your campaign is safe today. Log anything you manage. Hold every order and the Truce comes back at midnight.',
    better: "I'm feeling better",
    betterHint: 'Takes the Truce back',
    chip: 'Sick day',
  },

  /** The wake sheet: when you woke, when you slept. */
  wakeSheet: {
    title: 'Report for duty',
    editTitle: 'Wake and sleep times',
    wokeLabel: 'Woke up at',
    sleptLabel: 'Went to sleep at',
    pickerHint: 'Opens the clock',
    sleepLine: (duration: string): string => `${duration} of sleep`,
    errors: {
      inFuture: "That wake time hasn't happened yet.",
      tooShort: 'Under an hour of sleep? Check the times.',
      tooLong: 'Over 16 hours of sleep? Check the times.',
    },
    save: 'Start the day',
    saveEdit: 'Save times',
    cancel: 'Not yet',
  },

  /** Proof: the selfie and body weight, under the orders. */
  proofSection: 'Proof',

  /** The user's own orders on Today. */
  customOrder: {
    /**
     * "3 of 12 glass", "12 glass · done", or "10 of 30 pages · minimum held" for older orders.
     * A done-or-not order (once a day, no unit) reads "Done" or "Not done yet".
     */
    line: (amount: number, min: number, full: number, unit: string, status: OrderStatus): string => {
      if (full === 1 && !unit) return status === 'full' ? 'Done' : 'Not done yet';
      const goal = unit ? `${full} ${unit}` : String(full);
      if (status === 'full') return `${goal} · done`;
      if (status === 'min' && min < full) return `${amount} of ${goal} · minimum held`;
      return `${amount} of ${goal}`;
    },
    /** Done-or-not is one tap; a small count adds one per tap; a big one (steps) is typed in. */
    action: (mode: CustomOrderMode): string => ({ check: 'Done', tap: '+1', typed: 'Log' })[mode],
    hint: (mode: CustomOrderMode): string =>
      ({
        check: 'Double tap once it is done. Long press to undo.',
        tap: 'Double tap to add one. Long press to take one back.',
        typed: "Double tap to type today's amount.",
      })[mode],
  },

  addOrder: 'Add an order',

  workoutSheet: {
    title: 'What did you train?',
    subtitle: 'Pick what you did. A few words help you see the pattern later.',
    holdTitle: 'Hold the line',
    holdDescription: (minutes: number): string => `${minutes} min walk or a short home set`,
    conquerTitle: 'Conquer',
    conquerDescription: (minutes: number): string => `${minutes} min, gym or home`,
    exactLabel: 'Exact time',
    exactAccessibility: 'Workout minutes',
    minutes: (minutes: number): string => `${minutes} min`,
    noteLabel: 'Note (optional)',
    notePlaceholder: 'Push day. Bench 3 sets, shoulder press.',
    save: 'Log workout',
    cancel: 'Not yet',
  },

  stamp: {
    stampText: 'VINCO',
    title: 'Day conquered',
    titleWithDay: (romanDay: string): string => `Day ${romanDay} conquered`,
    subtitle: 'Every order at its full goal. Tomorrow, the same line holds.',
    seal: 'Seal the day',
    back: 'Back to Today',
  },
} as const;
