/** The user menu on Today: the account, settings, permissions and the rest of the camp. */
export const menuCopy = {
  title: 'Your menu',
  close: 'Close the menu',
  account: {
    name: 'Your account',
    status: 'On this phone only',
    detail: 'Sign-in and backup arrive in an update.',
  },
  items: {
    settings: { label: 'Settings', detail: 'Tone, look, sounds, wake-up' },
    plan: { label: 'Orders and to-dos', detail: 'Add, remove and plan' },
    permissions: { label: 'Permissions', detail: 'Camera, microphone, alerts' },
    guard: { label: 'Guard levels', detail: 'Pax to Imperium, in preview' },
    aurora: { label: 'Aurora alarm', detail: 'Missions to wake up, in preview' },
    forum: { label: 'The Forum', detail: 'Spend your denarii' },
  },
  oath: {
    label: 'Your oath',
    listen: (left: number): string => `Listen · ${left} left today`,
    stop: 'Stop',
    none: 'Not recorded',
    usedUp: 'Heard twice today. Back tomorrow.',
  },
} as const;
