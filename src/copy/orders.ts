import { CUSTOM_ORDER_LIMITS, type CustomOrderError } from '@/features/orders';

/** Adding and managing orders: Vinco's four and the user's own. Rules in docs/ORDERS-AND-TASKS.md. */
export const ordersCopy = {
  screen: {
    eyebrow: 'Orders',
    title: 'Your orders',
    intro:
      'Every order must hold for the day to count. Hit the minimum and the campaign lives; hit the full goal and you conquer.',
    vincoSection: 'Set by Vinco',
    ownSection: 'Your own',
    ownEmpty: 'None yet. Add one you will follow no matter what: reading, steps, study.',
    goals: (min: string, full: string): string => `Hold the line: ${min} · Conquer: ${full}`,
    standDown: 'Stand down',
    standsDownTomorrow: 'Counts today, gone from tomorrow',
    back: 'Back',
  },

  /** Plain goals for Vinco's four, from their targets. */
  vincoGoals: {
    water: (litres: number): string => `${litres} L`,

    meal: (meals: number): string => `${meals} ${meals === 1 ? 'meal' : 'meals'}`,
    workout: (minutes: number): string => `${minutes} min`,
  },
  vincoNames: { water: 'Water', wake: 'Wake-up', meal: 'Protein meal', workout: 'Workout' },
  /** Wake-up has one step: tapping "I'm up". */
  wakeLine: (time: string | null): string =>
    time
      ? `Tap "I'm up" once you are out of bed · planned for ${time}`
      : `Tap "I'm up" once you are out of bed`,

  add: {
    title: 'Add an order',
    body: "An order is followed no matter what. It counts from today, and the day isn't held until it is.",
    nameLabel: 'Order',
    namePlaceholder: 'Read',
    unitLabel: 'Unit (optional)',
    unitPlaceholder: 'pages',
    minLabel: 'Hold the line (minimum)',
    fullLabel: 'Conquer (full goal)',
    save: 'Add to my orders',
    cancel: 'Not now',
    limit: (max: number): string =>
      `You have ${max} own orders, the most Vinco allows. Stand one down to add another.`,
    errors: {
      nameMissing: 'Give the order a name.',
      goalInvalid: `Goals are whole numbers from ${CUSTOM_ORDER_LIMITS.minGoal} to ${CUSTOM_ORDER_LIMITS.maxGoal}.`,
      fullBelowMin: 'The full goal must be at least the minimum.',
      tooMany: `You already have ${CUSTOM_ORDER_LIMITS.maxActive} own orders.`,
    } satisfies Record<CustomOrderError, string>,
    failed: "The order couldn't be saved. Try again.",
  },

  standDownSheet: {
    title: (name: string): string => `Stand down "${name}"?`,
    body: 'It still counts today, so finish it. From tomorrow it is gone. Past days keep their results.',
    bodyAddedToday: 'It was added today, so it is removed straight away.',
    confirm: 'Stand it down',
    cancel: 'Keep it',
  },
} as const;
