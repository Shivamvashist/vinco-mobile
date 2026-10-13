import type { ColorMode } from '@/theme';

import { tabsCopy } from './tabs';

/** The Castra (Settings) tab: how Vinco looks, sounds and talks, the day's setup and the journey. */
export const settingsCopy = {
  eyebrow: `${tabsCopy.settings.latin} · ${tabsCopy.settings.meaning}`,
  title: 'Settings',

  sections: {
    you: 'You',
    day: 'Your day',
    guard: 'Guard',
    oath: 'Your oath',
    journey: 'Journey',
    about: 'About',
  },

  rows: {
    tone: 'Tone',
    colorMode: 'Appearance',
    sound: 'Sounds',
    soundDetail: 'The DAY I seal and the VINCO stamp always play.',
    haptics: 'Vibration',
    outline: 'Selfie outline',
    outlineValue: (percent: number): string => (percent === 0 ? 'Off' : `${percent}%`),
    plan: 'Orders and to-dos',
    planValue: 'Manage',
    wakeTime: 'Wake-up time',
    oath: 'Listen to your oath',
    oathSealed: (dayRoman: string): string => `Sealed until Day ${dayRoman}`,
    oathListen: 'Listen',
    oathStop: 'Stop',
    oathNone: 'Not recorded',
    retreat: 'Sound the retreat',
    retreatValue: 'Reset journey',
    version: 'Version',
    devMode: 'Dev mode',
  },

  colorModes: {
    dark: 'Dark',
    light: 'Light',
    system: 'Match phone',
  } satisfies Record<ColorMode, string>,

  sheets: {
    tone: 'How should Vinco talk to you?',
    colorMode: 'Appearance',
    outline: {
      title: 'Selfie outline',
      body: "How strongly yesterday's selfie shows over the camera, so today's lines up. You can change it on the camera too.",
      label: "Yesterday's outline",
    },
    wakeTime: {
      title: 'Wake-up time',
      body: 'Up by this time conquers the wake-up order. Changes count from your next "I\'m up".',
      field: 'Up by',
      save: 'Save',
      saveFailed: 'Could not save the time. Try again.',
    },
  },

  /** Before an arc exists, the day settings have nothing to change. */
  noArc: 'Begin your arc to set up your day.',
} as const;
