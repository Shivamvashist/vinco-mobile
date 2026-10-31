/**
 * The permissions list, shown in onboarding and on the Permissions screen from the user menu:
 * what Vinco may use, and why. The focus guard's disclosure lives in focus.ts (`permission`) and
 * the alarm's labels in aurora.ts (`status`), so each is written once.
 */
export const permissionsCopy = {
  eyebrow: 'Permissions',
  title: 'What Vinco can use',
  intro: 'Everything stays on this phone. Turn any of these off in your phone settings at any time.',
  status: {
    granted: 'Allowed',
    denied: 'Not allowed',
    undetermined: 'Not asked yet',
    checking: 'Checking',
    unsupported: 'Vinco build',
  },
  allow: 'Allow',
  openSettings: 'Open phone settings',
  optional: 'Optional',
  /** What a screen reader says for a row's button: "Allow, Camera". */
  actionAccessibilityLabel: (action: string, permission: string): string => `${action}, ${permission}`,
  groups: {
    daily: 'Every day',
    alarm: 'Aurora (the alarm)',
    guard: 'Focus guard',
  },
  vincoBuild: 'Arrives with the Vinco build. Nothing to allow here yet.',
  items: {
    camera: {
      label: 'Camera',
      why: 'For your daily selfie. Photos never leave the phone.',
    },
    microphone: {
      label: 'Microphone',
      why: 'For recording your oath and workout notes.',
    },
    notifications: {
      label: 'Reminders',
      why: 'Up to three nudges a day, only while something is left to do. Never between 11 pm and your wake-up.',
    },
    accessibility: {
      label: 'Accessibility service',
    },
    overlay: {
      label: 'Display over other apps',
      why: "Shows the guard's alert and the floating timer over other apps during a focus.",
    },
  },
} as const;
