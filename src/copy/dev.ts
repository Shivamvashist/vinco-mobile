/** Dev mode (dev builds only). Plain words: this is a tool, not part of the story. */
export const devCopy = {
  section: 'Dev tools',
  lastCrash: (when: string, where: string): string => `Last crash: ${when} (${where})`,
  clearCrash: 'Clear',
  today: (label: string, offset: number): string =>
    offset === 0
      ? `Today: ${label} (real clock)`
      : `Today: ${label} (${offset} ${offset === 1 ? 'day' : 'days'} ahead)`,
  holdToday: "Hold today's orders",
  conquerToday: "Conquer today's orders",
  nextDay: 'Move to next day',
  nextDayHint: 'Seals today as it stands, like a real midnight.',
  atMaxOffset: "The clock can't run further ahead.",
  previousDay: 'Go back a day',
  backToToday: 'Back to the real day',
  rewindHint: 'Removes the days after the new today, so they can be lived again.',
  rewindTitle: (label: string): string => `Go back to ${label}?`,
  rewindBody: (label: string): string =>
    `Removes everything after ${label}: orders, seals, selfies, tasks, focus, rewards and denarii from those days. ${label} opens again. Dev only.`,
  rewindConfirm: 'Remove and go back',
  rewindBeforeArc: "Can't go back before your first arc began. Use Reset everything instead.",
  noArc: 'Finish onboarding to use the day tools.',
  addDenarii: (amount: number): string => `Add ${amount} denarii`,
  addedDenarii: (total: number): string => `Dev grant today: ${total} denarii.`,
  themeLab: 'Theme lab',
  resetAll: 'Reset everything',
  resetTitle: 'Reset everything?',
  resetBody:
    'Deletes the journey, selfies, oath and preferences, and returns the clock to the real day. Dev only.',
  cancel: 'Cancel',
  failed: "That didn't save. Check the console.",
} as const;
