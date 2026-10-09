/** Dev mode (dev builds only). Plain words: this is a tool, not part of the story. */
export const devCopy = {
  section: 'Dev tools',
  today: (label: string, offset: number): string =>
    offset === 0
      ? `Today: ${label} (real clock)`
      : `Today: ${label} (${offset} ${offset === 1 ? 'day' : 'days'} ahead)`,
  holdToday: "Hold today's orders",
  conquerToday: "Conquer today's orders",
  nextDay: 'Move to next day',
  nextDayHint: 'Seals today as it stands, like a real midnight.',
  atMaxOffset: "The clock can't run further ahead.",
  noArc: 'Finish onboarding to use the day tools.',
  themeLab: 'Theme lab',
  resetAll: 'Reset everything',
  resetTitle: 'Reset everything?',
  resetBody:
    'Deletes the journey, selfies, oath and preferences, and returns the clock to the real day. Dev only.',
  cancel: 'Cancel',
  failed: "That didn't save. Check the console.",
} as const;
