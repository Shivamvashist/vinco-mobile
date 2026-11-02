import type { AuroraMission } from '@/features/aurora';
import type { GuardLevel } from '@/features/guard';

import type { ToneLines } from './toneLines';

/** The guard levels and Aurora: settings in preview until the native build ships. */
export const guardCopy = {
  preview: {
    title: 'Arrives with the Vinco build',
    body: 'Your choice is saved and switches on with the build.',
  },

  levels: {
    eyebrow: 'Guard · The watch',
    title: 'How hard should Vinco guard you?',
    names: {
      pax: { name: '"Pax"', plain: 'Peace', does: 'Counts only. Nothing interrupts you.' },
      vigil: {
        name: '"Vigil"',
        plain: 'The watch',
        does: 'Counts reels with a floating badge, and steps in past your budget.',
      },
      guard: {
        name: '"Custos"',
        plain: 'The guard',
        does: 'A quick "why are you opening this?" check before a marked app.',
      },
      imperium: {
        name: '"Imperium"',
        plain: 'Command',
        does: 'Blocks marked apps after your limit. Finish your orders to earn a 10-minute "Clementia" (mercy).',
      },
    } satisfies Record<GuardLevel, { name: string; plain: string; does: string }>,
    ships: (version: string): string => `Version ${version}`,
    budgetSection: 'Daily reel budget',
    budgetLabel: 'Reels a day',
    budgetValue: (reels: number): string => `${reels} reels`,
    budgetAdjust: 'Daily reel budget',
    budgetNote: 'Past it: a reel pass, 12 more for 20 denarii (3 a day).',
    privacyTitle: 'What the Vigil reads',
    privacy:
      'Only whether a reels screen is open and when a new video starts. Never messages, captions, usernames, passwords or video. Nothing on screen is saved or sent.',
    neverBlocked: 'Imperium never blocks calls, contacts, payments or maps. Turning it off takes 24 hours.',
  },

  /** The reel counter: the guard screen's count, and the words on the native badge and cards. */
  reels: {
    section: 'Reels today',
    count: (count: number, budget: number): string => `${count} of ${budget}`,
    countLabel: (count: number, budget: number): string =>
      `${count} ${count === 1 ? 'reel' : 'reels'} today, budget ${budget}`,
    yesterday: (count: number): string => `Yesterday: ${count}`,
    noYesterday: 'Yesterday: no count',
    apps: (names: readonly string[]): string => `Counted in ${joinNames(names)}.`,
    offTitle: 'The counter is off',
    offBody:
      "Vinco counts reels with Android's accessibility service, the same one the focus guard uses. In the apps above it notices only when a new reel or short scrolls into view. It never reads text, captions, usernames, messages or the videos. Only the number a day is kept, on this phone.",
    offKept: 'Counts so far are kept.',
    turnOn: 'Turn on the counter',
    turnOnHint: 'Opens the accessibility settings. Find "Vinco focus guard" and turn it on.',
    openHint: 'Opens the reel counter: the log, the reel pass and its settings',
    /** Native badge and cards: "{count}" and "{budget}" are filled in on the phone. */
    overlay: {
      badge: '{count} reels',
      badgeOne: '1 reel',
      badgeLabel: '{count} reels today. Budget {budget}.',
      budgetTitle: 'Budget reached: {count} reels',
      budgetBody: {
        philosopher:
          'This is the limit you set yourself, in a calmer hour. Close the app and keep your word.',
        centurion: 'Budget spent. Close the app and get back to your orders.',
        roast: 'The algorithm thanks you for your service. Shift over: close the app and go do one order.',
      } satisfies ToneLines,
      milestoneTitle: '{count} reels today',
      milestoneBody: {
        philosopher: 'Is the next one worth more than the next minute of your day? Close the app and choose.',
        centurion: 'Every reel is a minute off the line. Close the app and march.',
        roast: 'That thumb has scrolled further than a legion marches. Put the phone down and go move.',
      } satisfies ToneLines,
      close: 'Close',
      panelTitle: 'Reels today',
      panelCount: '{count} of {budget}',
      panelPasses: '{passes} of {max} passes used',
      passAction: 'Reel pass +{reels}',
      passPrice: '{price} denarii',
      passesUsed: 'All {max} passes used today. The count starts again at midnight.',
      passShort: 'A pass costs {price} denarii. Earn them by holding the line.',
      blockTitle: '{count} reels, past your budget',
      blockBody: {
        philosopher:
          'You set this limit in a calmer hour. Keep your word: leave the feed and take the day back.',
        centurion: 'Budget spent. Every reel now is off the line. Leave and get back to your orders.',
        roast:
          'The algorithm is thrilled. Your thumb has clocked a full shift: leave now and go do one real thing.',
      } satisfies ToneLines,
      leave: 'Leave',
      badgeHint: 'Shows your reels today',
    },
  },

  aurora: {
    eyebrow: 'Alarm',
    title: 'Aurora',
    intro: 'Stops only after a mission.',
    on: 'Aurora on',
    time: 'Rings at',
    daysLabel: 'On these days',
    days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    dayNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    missionLabel: 'The mission',
    missions: {
      march: { name: 'March', does: 'Walk 30 steps.' },
      gladius: { name: 'Gladius', does: 'The sword: swing the phone 30 times.' },
      sky: { name: 'See the sky', does: 'Take a photo of daylight from a window.' },
      post: { name: 'Reach the post', does: 'Scan a code stuck in your bathroom.' },
    } satisfies Record<AuroraMission, { name: string; does: string }>,
    nextRing: (label: string): string => `Next ring: ${label}`,
    noDays: 'Pick at least one day.',
    passes: (count: number): string =>
      count === 0
        ? 'No alarm passes. Buy one in the Forum.'
        : `${count} alarm ${count === 1 ? 'pass' : 'passes'} held`,
  },

  settings: {
    level: 'Guard level',
    aurora: 'Aurora alarm',
    auroraOff: 'Off',
  },
} as const;

/** "A, B and C". */
function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
