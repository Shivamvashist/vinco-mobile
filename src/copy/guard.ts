import type { AuroraMission } from '@/features/aurora';
import type { GuardLevel } from '@/features/guard';

/** The guard levels and Aurora: settings in preview until the native build ships. */
export const guardCopy = {
  preview: {
    title: 'Arrives with the Vinco build',
    body: 'Counting reels and ringing alarms need parts of Android that Expo Go cannot reach. Choose now: your choice is kept and switches on with the build.',
  },

  levels: {
    eyebrow: 'Guard · The watch',
    title: 'How hard should Vinco guard you?',
    intro: 'Pick one. Each level includes the ones before it.',
    names: {
      pax: { name: '"Pax"', plain: 'Peace', does: 'Counts only. Nothing interrupts you.' },
      vigil: {
        name: '"Vigil"',
        plain: 'The watch',
        does: 'Counts reels and shows the floating badge and milestone cards.',
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
    budgetNote: 'Past it, 10 more reels cost 15 denarii, doubling each time that day. Three times at most.',
    privacyTitle: 'What the Vigil reads',
    privacy:
      'Only whether a reels screen is open and when a new video starts. Never messages, captions, usernames, passwords or video. Nothing on screen is saved or sent.',
    neverBlocked: 'Imperium never blocks calls, contacts, payments or maps. Turning it off takes 24 hours.',
  },

  aurora: {
    eyebrow: '"Aurora" · Alarm',
    title: 'Aurora',
    intro: 'An alarm that stops only after a mission. "I\'m sick" stops it and calls a sick-day Truce.',
    on: 'Aurora on',
    time: 'Rings at',
    daysLabel: 'On these days',
    days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    dayNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    missionLabel: 'The mission',
    missions: {
      march: { name: 'March', does: 'Walk 30 steps.' },
      sky: { name: 'See the sky', does: 'Take a photo of daylight from a window.' },
      post: { name: 'Reach the post', does: 'Scan a code stuck in your bathroom.' },
    } satisfies Record<AuroraMission, { name: string; does: string }>,
    nextRing: (label: string): string => `Next ring: ${label}`,
    noDays: 'Pick at least one day.',
    passes: (count: number): string =>
      count === 0
        ? 'No alarm passes. Buy one in the Forum.'
        : `${count} alarm ${count === 1 ? 'pass' : 'passes'} held`,
    followsWake: 'Matches your wake-up time',
  },

  settings: {
    level: 'Guard level',
    aurora: 'Aurora alarm',
    auroraOff: 'Off',
  },
} as const;
