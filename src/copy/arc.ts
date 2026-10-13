import type { ArcLength } from '@/features/arc';

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
  },

  /** Free training: the open plan, no streak. */
  ludusName: 'Free training',
  ludusCaption: (startLabel: string, dayRoman: string): string => `Since ${startLabel} · Day ${dayRoman}`,

  stats: {
    section: 'Your record',
    campaign: 'Campaign',
    best: 'Best campaign',
    trained: 'Days trained',
    conquered: 'Days conquered',
    held: 'Held at the minimum',
    trucesUsed: 'Truces called',
    selfies: 'Selfies',
    daysSoFar: 'Days since Day I',
  },

  treasury: {
    section: 'Treasury',
    denarii: (amount: number): string => `${amount} denarii`,
    truces: (count: number): string => `${count} ${count === 1 ? 'Truce' : 'Truces'}`,
    passes: (count: number): string => `${count} alarm ${count === 1 ? 'pass' : 'passes'}`,
    visit: 'Visit the Forum',
    trucesHint: 'How Truces work',
  },

  decorations: {
    section: 'Decorations',
    count: (earned: number, total: number): string => `${earned} of ${total} earned`,
    earned: 'Earned',
    items: {
      firstSeal: { name: 'First seal', how: 'Hold the line for one day.' },
      conqueror: { name: 'Conqueror', how: 'Conquer a day: every order at its full goal.' },
      ironWeek: { name: 'Iron week', how: 'Seven days of campaign in a row.' },
      resurgo: { name: '"Resurgo"', how: 'I rise again: hold the day after a miss.' },
      halfway: {
        name: 'Halfway to Rome',
        how: 'Pass the middle of your campaign (30 days in free training).',
      },
      proofKeeper: { name: 'Proof keeper', how: 'Take seven selfies.' },
      oathKeeper: { name: 'Oath keeper', how: 'Reach Day X with your oath recorded.' },
    },
  },

  past: {
    section: 'Past arcs',
    ludus: 'Free training',
    dates: (startLabel: string, endLabel: string): string => `${startLabel} to ${endLabel}`,
    done: (completed: number, conquered: number): string =>
      `${completed} ${completed === 1 ? 'day' : 'days'} held · ${conquered} conquered`,
    finished: 'Complete',
    ended: 'Ended early',
  },

  /** Moving between campaigns and free training. */
  choice: {
    ludusTitle: 'Ready for a campaign?',
    ludusBody: 'Pick a length and it starts today. Your orders, wake-up time and oath come with you.',
    begin: 'Begin a campaign',
    finishedTitle: 'Campaign complete',
    finishedBody: 'You finished what you started. What next?',
    another: 'Begin another campaign',
    toLudus: 'Switch to free training',
    leaveForLudus: 'Switch to free training instead',
    sheetTitle: 'Begin a campaign',
    sheetBody: 'It starts today, Day I. Your orders, wake-up time and oath come with you.',
    start: (lengthRoman: string): string => `Begin ${lengthRoman} days`,
    ludusSheetTitle: 'Leave the campaign?',
    ludusSheetBody:
      'Your campaign ends today and you switch to free training: no streak, no fall. Your record stays in Past arcs. This is not a retreat: nothing is wiped.',
    ludusConfirm: 'Switch to free training',
    cancel: 'Stay',
    failed: 'That did not save. Nothing changed. Try again.',
  },

  sheets: {
    truces: (count: number): string =>
      count === 0 ? 'No Truces in reserve' : `${count} ${count === 1 ? 'Truce' : 'Truces'} in reserve`,
  },

  /** How Truces are earned, under the reserve count. */
  truceInfo: (everyDays: number, max: number, price: number): string =>
    `Earn one every ${everyDays} days of campaign (hold up to ${max}). Buy one ahead in the Forum for ${price} denarii, or at the moment a day falls.`,

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
