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
    roast:
      'Current rank: Professional Scroller, Third Class. Your thumb has a six-pack. Begin your arc and earn Tiro instead.',
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
    orders: 'Your orders',
    ordersValue: 'Add or stand down',
    truces: 'Truces in reserve',
    retreat: 'Sound the retreat',
    retreatValue: 'Reset journey',
    devMode: 'Dev mode',
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
    truces: (count: number): string =>
      count === 0 ? 'No Truces in reserve' : `${count} ${count === 1 ? 'Truce' : 'Truces'} in reserve`,
  },

  /** How Truces are earned, under the reserve count. */
  truceInfo: (everyDays: number, max: number, price: number): string =>
    `Earn one every ${everyDays} days of campaign (hold up to ${max}), or buy one for ${price} denarii when a day falls.`,

  /** Resetting the journey. The typed word guards against a slip of the thumb. */
  retreat: {
    title: 'Sound the retreat?',
    body: 'Your arc ends here. Every day, selfie, your oath, rank, denarii and Truce is wiped from this phone, and you stand at the Rubicon again. There is no undo.',
    word: 'RETREAT',
    fieldLabel: (word: string): string => `Type ${word} to confirm`,
    confirm: 'Retreat to the Rubicon',
    cancel: 'Hold the line',
    failed: 'The retreat failed. Nothing was wiped. Try again.',
  },
} as const;
