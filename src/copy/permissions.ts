/** The permissions screen, from the user menu: what Vinco may use, and why. */
export const permissionsCopy = {
  eyebrow: 'Permissions',
  title: 'What Vinco can use',
  intro: 'Everything stays on this phone. Turn any of these off in your phone settings at any time.',
  status: { granted: 'Allowed', denied: 'Not allowed', undetermined: 'Not asked yet', checking: 'Checking' },
  allow: 'Allow',
  openSettings: 'Open phone settings',
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
      why: 'Up to three nudges a day, and the Aurora alarm. Arrive in an update.',
    },
    guard: {
      label: 'Reel counter',
      why: 'Accessibility and display over apps, for the Vigil. Needs the full Vinco build.',
    },
  },
  later: 'Later',
} as const;
