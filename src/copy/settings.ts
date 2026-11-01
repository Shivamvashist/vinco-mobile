import type { ColorMode } from '@/theme';

import { tabsCopy } from './tabs';

/** Castra (Settings), from the user menu: how Vinco looks, sounds and talks, the day's setup and the journey. */
export const settingsCopy = {
  eyebrow: `${tabsCopy.settings.latin} · ${tabsCopy.settings.meaning}`,
  title: 'Settings',

  sections: {
    you: 'You',
    day: 'Your day',
    guard: 'Guard',
    journey: 'Journey',
    about: 'About',
  },

  rows: {
    tone: 'Tone',
    colorMode: 'Appearance',
    sound: 'Sounds',
    haptics: 'Vibration',
    outline: 'Selfie outline',
    outlineValue: (percent: number): string => (percent === 0 ? 'Off' : `${percent}%`),
    plan: 'Orders and to-dos',
    planValue: 'Manage',
    wakeTime: 'Wake-up time',
    retreat: 'Sound the retreat',
    retreatValue: 'Reset journey',
    version: 'Version',
    devMode: 'Dev mode',
  },

  /** The Appearance screen: the mode, then a palette for dark and one for light. */
  appearance: {
    title: 'Appearance',
    mode: 'Mode',
    darkSection: 'Dark palettes',
    lightSection: 'Light palettes',
    rowValue: (mode: string, palette: string): string => `${mode} · ${palette}`,
    selected: 'Selected',
    paletteLabel: (name: string, meaning: string, isSelected: boolean): string =>
      `${name}, ${meaning}${isSelected ? ', selected' : ''}`,
  },

  /** Every palette's plain label, beside its Latin name. */
  palettes: {
    basalt: 'Dark stone',
    nox: 'True black',
    purpura: 'Imperial purple',
    aes: 'Bronze green',
    marble: 'Light stone',
    papyrus: 'Parchment',
    calx: 'Limestone',
    alba: 'First light',
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
      body: "How strongly yesterday's selfie shows over the camera.",
      label: "Yesterday's outline",
    },
    wakeTime: {
      title: 'Wake-up time',
      body: 'Up by this time conquers the wake-up order.',
      field: 'Up by',
      save: 'Save',
      saveFailed: 'Could not save the time. Try again.',
    },
  },

  /** Before an arc exists, the day settings have nothing to change. */
  noArc: 'Begin your arc to set up your day.',
} as const;
