import { type GuardLevel, REEL_PASS } from '@/features/guard';
import type { DayKey } from '@/lib/dates';

import { commonCopy } from './common';

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/**
 * The reel counter's own screen (/reels): today against the budget, the log as bars, the reel
 * pass, and the settings that matter for reels. The words on the native badge and cards live in
 * guard.ts (`reels.overlay`).
 */
export const reelsCopy = {
  eyebrow: '"The Vigil" · Reel counter',
  title: 'Reels',
  back: 'Back',

  today: {
    of: (allowance: number): string => `of ${allowance} today`,
    label: (count: number, allowance: number): string =>
      `${count} ${plural(count, 'reel', 'reels')} today, of ${allowance} allowed`,
    left: (left: number): string => `${left} left`,
    over: (over: number): string => `${over} past the budget`,
    atBudget: 'Budget reached',
    passes: (passes: number): string =>
      `Budget plus ${passes} reel ${plural(passes, 'pass', 'passes')} (+${passes * REEL_PASS.reels})`,
    pass: `Reel pass +${REEL_PASS.reels}`,
    passHint: `Adds ${REEL_PASS.reels} reels to today's budget for ${REEL_PASS.price} denarii`,
  },

  status: {
    notYet: 'Counting arrives with the Vinco build. Your settings are kept.',
    off: 'The counter is off',
    offAction: 'Turn on',
    offHint: 'Opens what Vinco may use, with what the counter reads, before the phone settings',
  },

  log: {
    section: 'Log',
    views: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
    ] as const,
    previous: (view: 'day' | 'week'): string => (view === 'day' ? 'Previous week' : 'Previous eight weeks'),
    next: (view: 'day' | 'week'): string => (view === 'day' ? 'Next week' : 'Next eight weeks'),
    weekName: (start: DayKey, today: DayKey): string => `Week of ${commonCopy.dayLabel(start, today)}`,
    barValue: (name: string, total: number, over: number): string =>
      over > 0
        ? `${name}: ${total} ${plural(total, 'reel', 'reels')}, ${over} past the budget`
        : `${name}: ${total} ${plural(total, 'reel', 'reels')}`,
    legendWithin: 'Within budget',
    legendOver: 'Past budget',
    budgetLine: (value: number): string => `Budget ${value}`,
    budgetLineLabel: (value: number): string => `Budget line at ${value} reels`,
    scale: (top: string): string => `Scale up to ${top} reels`,
    empty: 'No reels counted yet. Days appear here once the counter is on.',
  },

  settings: {
    section: 'Settings',
    level: 'Guard level',
    levelDoes: {
      pax: 'Counts only. No badge, nothing interrupts.',
      vigil: 'The badge over reels, and a card on every reel past the budget that you can close.',
      guard: 'The badge, and a card past the budget with no close: leave, or buy a pass.',
      imperium: 'The badge, and a card past the budget with no close: leave, or buy a pass.',
    } satisfies Record<GuardLevel, string>,
    budget: 'Daily budget',
    budgetValue: (reels: number): string => `${reels} reels`,
    budgetAdjust: 'Daily reel budget',
    apps: (names: readonly string[]): string =>
      `Counted in ${names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`}.`,
    more: 'All guard levels',
  },

  sheet: {
    title: `Reel pass +${REEL_PASS.reels}`,
    body: `${REEL_PASS.reels} more reels today, over your budget. Passes reset at midnight.`,
    rule: (used: number): string => `${used} of ${REEL_PASS.maxPerDay} used today`,
    price: `${REEL_PASS.price} denarii`,
    balanceAfter: (balance: number): string => `${balance} denarii left after`,
    buy: `Buy for ${REEL_PASS.price} denarii`,
    needMore: (short: number): string => `Need ${short} more denarii`,
    dailyLimit: `All ${REEL_PASS.maxPerDay} used today`,
    paxNote: 'At "Pax" (Peace) nothing interrupts, so a pass changes nothing today.',
    cancel: 'Not now',
    failed: 'The pass could not be bought. Try again.',
  },
} as const;
