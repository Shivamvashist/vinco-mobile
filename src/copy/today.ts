import type { CustomOrderMode, OrderKind, OrderStatus } from '@/features/orders';

import { tabsCopy } from './tabs';

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/** Litres shown without trailing zeros: 2, 2.5. */
const litres = (value: number): string => `${Number(value.toFixed(2))}`;

/** The Veni (Today) tab. */
export const todayCopy = {
  eyebrow: `${tabsCopy.veni.latin} · ${tabsCopy.veni.meaning}`,
  /** The one section under the tiles: a switch between the orders and the day's tasks. */
  section: {
    orders: 'Orders',
    tasks: 'Tasks',
  },
  /** "Day XII of LX" (shown in caps). */
  arcEyebrow: (dayRoman: string, lengthRoman: string): string => `Day ${dayRoman} of ${lengthRoman}`,
  arcFinishedEyebrow: 'Arc complete',
  /** Free training has no day count and no end: the eyebrow names the plan only (shown in caps). */
  ludusEyebrow: 'Free training',
  /** After a campaign's last day: the way on, from Today. */
  finished: {
    title: 'Campaign complete',
    action: 'Choose what next',
  },

  /** Shown while a Truce can still save the campaign (until today ends). */
  truceBanner: {
    title: 'Yesterday fell',
    /** For screen readers: the banner in one sentence. */
    detail: (campaign: number, days: number): string =>
      `${days === 1 ? 'A Truce' : `${days} Truces`} can still save your ${campaign}-day campaign, until midnight.`,
    action: 'See your options',
  },

  saveError: 'That last change could not be saved. Try again; nothing else was lost.',

  ringLabel: (held: number, total: number): string => `${held} of ${total} orders held`,
  menuLabel: 'Open your menu',

  /** The daily logs, as rows in the Tasks list: the value once logged today, else the name. */
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

  /** The Dies card (the hero): today's orders as one big number over the day's path. */
  hero: {
    states: {
      open: 'Open',
      held: 'Held',
      conquered: 'Conquered',
      sick: 'Sick day',
      finished: 'Arc complete',
    },
    of: (total: number): string => `/${total}`,
    /**
     * After a few seconds the count gives way to the sky: the sun or moon on the path and the
     * time left in the day ("7 h 12 m", then "left").
     */
    left: 'left',
    /** For screen readers: the whole card in one sentence (activity: from `activity`, or empty). */
    accessibleLabel: (held: number, total: number, state: string, activity = ''): string =>
      `Today, ${state}. ${held} of ${total} orders held. ${activity ? `${activity} ` : ''}Opens today's summary.`,
    /** The day path's marks in words: how many things were done today, and when the last was. */
    activity: (count: number, lastAt: string | null): string =>
      count <= 0
        ? ''
        : `${count} ${count === 1 ? 'activity' : 'activities'} today${lastAt ? `, last at ${lastAt}` : ''}.`,
  },

  /** The two tiles under the hero: Reels (here) and Focus (focusCopy.tile). */
  tiles: {
    reels: {
      title: 'Reels',
      /** Under the count: the day's budget. */
      of: (budget: number): string => `of ${budget}`,
      /** Where reels can't be counted yet (Expo Go, no permission). */
      setUp: 'Set up',
      label: (count: number, budget: number): string => `Reels, ${count} of ${budget} today`,
      setUpLabel: 'Reels, not counted yet',
      hint: 'Opens the reel counter',
    },
  },

  /** Today's summary, from the hero. Facts, not sentences. */
  summary: {
    title: 'Today',
    orders: 'Orders',
    denarii: 'Denarii',
    run: 'Run',
    ordersLabel: (held: number, total: number): string => `${held} of ${total} orders held`,
    denariiLabel: (earned: number): string => `${earned} denarii today`,
    runLabel: (days: number): string => `Run, ${days} in a row. Opens what the run pays.`,
    timeline: 'Timeline',
    empty: 'Nothing yet today.',
    kinds: {
      order: 'Order',
      wake: 'Up',
      task: 'Task',
      focus: 'Focus',
      selfie: 'Selfie',
      weight: 'Weight',
      calories: 'Calories',
      reward: 'Reward',
      truce: 'Truce',
    },
    /** Several in a row of the same kind: "Order ×3". */
    times: (count: number): string => `×${count}`,
    dayCard: 'Seal the day',
    dayCardHint: 'Opens your day card',
  },

  /** The run pay sheet, from the summary. */
  runSheet: {
    title: '"Stipendium" (run pay)',
    body: 'Every week of a run pays on days 3, 5 and 7. Long runs pay a bonus on top.',
    weekly: (day: number, amount: number): string => `Day ${day} of each week · +${amount}`,
    truce: 'Day 7 in a campaign · a Truce',
    milestone: (day: number, amount: number): string => `${day} days in a row · +${amount}`,
    close: 'Close',
  },

  /** The run's next reward, on the run tile, its sheet and in reminders. */
  streak: {
    next: (inDays: number, denarii: number, hasTruce: boolean): string => {
      const when = inDays === 1 ? 'Hold today' : `${inDays} more days`;
      const what = [denarii > 0 ? `+${denarii} denarii` : null, hasTruce ? 'a Truce' : null]
        .filter(Boolean)
        .join(' and ');
      return `${when}: ${what}`;
    },
  },

  /** A short notice when today's pay changes. */
  denariiNotice: {
    paid: (amount: number): string => `+${amount} denarii`,
    takenBack: (amount: number): string => `${amount} denarii taken back until the day holds again`,
  },

  /** Free training with no orders yet: one suggestion, and a way to add your own. */
  noOrders: {
    title: 'No orders yet',
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
    greeting: (hour: number): string =>
      hour < 5 ? 'Up early' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening',
    /** For screen readers, on the planned time shown at the top of the dawn card. */
    planned: (time: string): string => `Planned wake-up: ${time}`,
    action: "I'm up",
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
    better: "I'm feeling better",
    betterHint: 'Takes the Truce back',
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
        check: 'Double tap to mark it done, or not done again.',
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
