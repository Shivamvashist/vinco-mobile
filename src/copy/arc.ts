import type { ArcLength } from '@/features/arc';
import type { ColorMode } from '@/theme';

import { tabsCopy } from './tabs';
import type { ToneLines } from './toneLines';

/** The Vici (Arc) tab. */
export const arcCopy = {
  eyebrow: `${tabsCopy.vici.latin} · ${tabsCopy.vici.meaning}`,
  title: 'The arc',

  /** Shown until an arc has begun. */
  emptyLine: {
    philosopher: 'The arc is long, and it is yours to walk. Your rank and progress will rise here.',
    centurion: 'No campaign on record. Begin your arc and earn your first rank: Tiro.',
    roast: 'Your current rank is "professional scroller". Begin your arc and earn Tiro instead.',
  } satisfies ToneLines,

  /** The arc's name by length, matching onboarding. */
  names: {
    30: 'First campaign',
    60: 'The winter arc',
    90: 'Legend tier',
  } satisfies Record<ArcLength, string>,
  fallbackName: 'Your arc',
  dates: (startLabel: string, endLabel: string, dayRoman: string, lengthRoman: string): string =>
    `${startLabel} to ${endLabel} · Day ${dayRoman} of ${lengthRoman}`,
  datesFinished: (startLabel: string, endLabel: string): string => `${startLabel} to ${endLabel} · Complete`,
  journeyLabel: (day: number, length: number): string => `Day ${day} of ${length}`,

  rank: {
    noneTitle: 'No rank yet',
    noneDetail: 'Hold the line today to earn Tiro.',
    next: (meaning: string, nextName: string, days: number): string =>
      `${meaning}. Next: ${nextName} in ${days} ${days === 1 ? 'day' : 'days'}.`,
    top: (meaning: string): string => `${meaning}. The highest rank.`,
    progressLabel: 'Progress to next rank',
    denarii: (amount: number): string => `${amount} denarii earned`,
  },

  settingsSection: 'Settings',
  settings: {
    tone: 'Tone',
    colorMode: 'Appearance',
    sound: 'Sounds',
    haptics: 'Vibration',
    truce: 'Truce this week',
    truceReady: '1 left',
    truceUsed: 'Used',
    oath: 'Your oath',
    oathSealed: (dayRoman: string): string => `Sealed until Day ${dayRoman}`,
    oathListen: 'Listen',
    oathStop: 'Stop',
    oathNone: 'Not recorded',
  },
  colorModes: {
    dark: 'Dark',
    light: 'Light',
    system: 'Match phone',
  } satisfies Record<ColorMode, string>,
  sheets: {
    tone: 'How should Vinco talk to you?',
    colorMode: 'Appearance',
  },
} as const;
