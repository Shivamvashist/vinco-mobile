import { CUSTOM_ORDER_LIMITS, type CustomOrderError } from '@/features/orders';

/** Adding and managing orders: Vinco's four and the user's own. Rules in docs/ORDERS-AND-TASKS.md. */
export const ordersCopy = {
  screen: {
    eyebrow: 'Orders',
    title: 'Your orders',
    intro:
      'Every order must hold for the day to count. Hit the minimum and the campaign lives; hit the full goal and you conquer.',
    introFree: 'Orders are done every day, no matter what. Finish them all and the day is yours.',
    vincoSection: 'Set by Vinco',
    vincoSectionFree: 'From Vinco',
    remove: 'Remove',
    addSuggestion: (name: string): string => `Add ${name.toLowerCase()}`,
    ownSection: 'Your own',
    ownEmpty: 'None yet. Add one you will follow no matter what: reading, steps, study.',
    goals: (min: string, full: string): string => `Hold the line: ${min} · Conquer: ${full}`,
    /** An own order whose minimum is its goal: "12 glass a day". */
    daily: (full: string): string => `${full} a day`,
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
    body: 'Something you do every day, no matter what. It counts from today.',
    nameLabel: 'What',
    namePlaceholder: 'Drink water',
    unitLabel: 'Unit',
    unitPlaceholder: 'glass',
    countLabel: 'How many a day',
    countPlaceholder: '12',
    /** "12 glass a day" under the fields, as the order will read. */
    preview: (count: number, unit: string): string => `${count}${unit ? ` ${unit}` : ''} a day`,
    save: 'Add to my orders',
    cancel: 'Not now',
    limit: (max: number): string =>
      `You have ${max} own orders, the most Vinco allows. Stand one down to add another.`,
    errors: {
      nameMissing: 'Give the order a name.',
      goalInvalid: `How many: a whole number from ${CUSTOM_ORDER_LIMITS.minGoal} to ${CUSTOM_ORDER_LIMITS.maxGoal}.`,
      fullBelowMin: 'The full goal must be at least the minimum.',
      tooMany: `You already have ${CUSTOM_ORDER_LIMITS.maxActive} own orders.`,
    } satisfies Record<CustomOrderError, string>,
    failed: "The order couldn't be saved. Try again.",
  },

  /** Setting an own order's amount by typing (big goals, or a quick fix). */
  amount: {
    title: (name: string): string => name,
    label: (unit: string): string => (unit ? `Done today (${unit})` : 'Done today'),
    goal: (full: number, unit: string): string => `Goal: ${full}${unit ? ` ${unit}` : ''}`,
    save: 'Save',
    cancel: 'Cancel',
    invalid: 'Type a whole number.',
  },

  removeSheet: {
    title: (name: string): string => `Remove ${name.toLowerCase()}?`,
    body: 'It stops counting from today. Days already sealed keep their results. You can add it back any time.',
    confirm: 'Remove it',
    cancel: 'Keep it',
  },

  standDownSheet: {
    title: (name: string): string => `Stand down "${name}"?`,
    body: 'It still counts today, so finish it. From tomorrow it is gone. Past days keep their results.',
    bodyAddedToday: 'It was added today, so it is removed straight away.',
    confirm: 'Stand it down',
    cancel: 'Keep it',
  },
} as const;
