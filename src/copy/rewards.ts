import type { DecorationId } from '@/features/campaign';
import type { FocusGuard } from '@/features/focus';
import type { ClaimCheck, ClaimPay, LabourId, Reward } from '@/features/labours';

import { arcCopy } from './arc';
import type { ToneLines } from './toneLines';

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

/** "1,240", then "12.4k" from ten thousand, so a counter stays narrow. */
const compact = (value: number): string => {
  const safe = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  if (safe < 10000) return safe.toLocaleString('en-GB');
  if (safe < 100000) return `${(safe / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${Math.round(safe / 1000)}k`;
};

/** A reward as short chips: "+5", "+15", "+1 Truce". */
const rewardParts = (
  reward: Reward | ClaimPay,
): { denarii: string; gloria: string; truces: string | null } => ({
  denarii: `+${reward.denarii}`,
  gloria: `+${reward.gloria}`,
  truces: reward.truces ? `+${plural(reward.truces, 'Truce', 'Truces')}` : null,
});

/** The HUD counters, Labours (Labores), claimable Decorations and Gloria (glory points). */
export const rewardsCopy = {
  hud: {
    count: compact,
    denariiLabel: (amount: number): string => `${plural(amount, 'denarius', 'denarii')}. Opens the Forum`,
    gloriaLabel: (amount: number): string => `${amount} Gloria, glory points. Opens your progress`,
    trucesLabel: (count: number): string => `${plural(count, 'Truce', 'Truces')} held. What a Truce does`,
    truceSheetTitle: (count: number): string => `${plural(count, 'Truce', 'Truces')} held`,
    truceSheetBody: (max: number, price: number): string =>
      `A Truce is a rest day that keeps your campaign alive when a day falls. Hold up to ${max}. Earn them by holding the line, from Labours and Decorations, or buy one for ${price} denarii in the Forum.`,
    openForum: 'Open the Forum',
  },

  rewards: {
    parts: rewardParts,
    denariiUnit: 'denarii',
    gloriaUnit: 'Gloria',
    /** A11y: "5 denarii, 15 Gloria and 1 Truce". */
    describe: (reward: Reward | ClaimPay): string =>
      [
        plural(reward.denarii, 'denarius', 'denarii'),
        `${reward.gloria} Gloria`,
        reward.truces ? plural(reward.truces, 'Truce', 'Truces') : null,
      ]
        .filter(Boolean)
        .join(', '),
    /** When the reserve is full, a Truce reward comes as its price instead. */
    truceConverted: (count: number, denarii: number): string =>
      `Your Truce reserve is full, so ${count === 1 ? 'the Truce comes' : 'the Truces come'} as ${denarii} denarii.`,
    paid: (pay: ClaimPay): string =>
      [
        `+${pay.denarii} denarii`,
        `+${pay.gloria} Gloria`,
        pay.truces ? `+${plural(pay.truces, 'Truce', 'Truces')}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    problems: {
      incomplete: 'Not done yet. It may have changed since you looked.',
      claimed: 'Already claimed.',
      unavailable: 'This one needs an order today.',
      failed: 'The claim did not go through. Nothing changed.',
    } satisfies Record<Exclude<ClaimCheck, 'ok'> | 'failed', string>,
  },

  labours: {
    title: 'Labours',
    latin: '"Labores" (tasks to earn)',
    seeAll: 'See all',
    seeAllLabel: 'See all labours',
    eyebrow: 'Labores · Tasks to earn',
    back: 'Back',
    intro:
      'Do the deed, then claim the pay. Each one pays once per day or week; an unclaimed one expires when its period ends.',
    groups: { daily: 'Daily', weekly: 'Weekly' },
    groupNote: { daily: 'New every day', weekly: 'Monday to Sunday' },
    resets: (type: 'daily' | 'weekly', days: number): string =>
      type === 'daily' ? 'Resets at midnight' : days <= 1 ? 'Resets tomorrow' : `Resets in ${days} days`,
    claim: 'Claim',
    claimLabel: (title: string, reward: string): string => `Claim ${title}: ${reward}`,
    claimed: 'Claimed',
    needsOrders: 'Needs an order today',
    forumTitle: 'Labours: tasks to earn',
    forumBody:
      'Daily and weekly bounties that pay denarii, Gloria and now and then a Truce. Claim them by hand.',
    forumAction: 'Open the Labours',
    wages:
      'Held and conquered days, run pay and focus pay land on their own. Labours are the bounties on top.',
    items: {
      selfie: { title: "Take today's selfie", line: 'Proof of the day, kept on your phone.' },
      weight: { title: 'Log your weight', line: 'One number, for the weekly trend.' },
      focus: { title: 'Focus 25 minutes', line: 'Hold one focus to the end.' },
      todos: { title: 'Finish 3 to-dos', line: 'Tick three off your list.' },
      conquer: { title: 'Conquer the day', line: 'Every order at its full goal.' },
      holdWeek: { title: 'Hold 5 days', line: 'Five days at least at the minimum.' },
      conquerWeek: { title: 'Conquer 3 days', line: 'Three days with every order at its full goal.' },
      focusWeek: { title: 'Focus 3 hours', line: '180 minutes of focus held to the end.' },
      wakeWeek: { title: 'Wake on time 5 days', line: 'Up by your planned wake time.' },
    } satisfies Record<LabourId, { title: string; line: string }>,
    progress: (id: LabourId, current: number, goal: number): string =>
      goal === 1
        ? current >= 1
          ? 'Done'
          : 'Not yet'
        : id === 'focus' || id === 'focusWeek'
          ? `${current} of ${goal} min`
          : `${current} of ${goal}`,
    /** When nothing is left to do on the board today. */
    allDone: {
      philosopher: 'Every labour is done for now. Rest is part of the work.',
      centurion: 'Board cleared. New orders at midnight.',
      roast:
        "Board cleared. Your phone is furious it couldn't distract you. New labours at midnight, go do something offline.",
    } satisfies ToneLines,
  },

  decorations: {
    claim: (denarii: number): string => `Claim +${denarii}`,
    claimLabel: (name: string, reward: string): string => `Claim ${name}: ${reward}`,
    claimed: 'Claimed',
    progress: (current: number, goal: number): string => `${current} of ${goal}`,
    pays: (reward: string): string => `Pays ${reward}`,
  },

  gloria: {
    section: 'Gloria',
    plain: 'glory points',
    total: (amount: number): string => compact(amount),
    totalLabel: (amount: number): string => `${amount} Gloria earned on your journey`,
    weekTitle: 'This week',
    weekTotal: (amount: number): string => `${compact(amount)} this week`,
    line: (amount: number): string => `Dashed line: a conquered day (${amount})`,
    describeBar: (dayLabel: string, amount: number): string => `${dayLabel}: ${amount} Gloria`,
    rules: 'Order held +10, full goal +5 more, conquered day +20, to-do +3, focus +1 a minute, plus claims.',
    calendarLegend: 'Deeper tint, more Gloria',
    history: 'Older days, months and years',
    historyLabel: 'Open your Gloria history, by day, week, month and year',
  },

  /** The Gloria history screen (/gloria): any day, week, month or year of the journey. */
  gloriaHistory: {
    eyebrow: '"Gloria" · glory points',
    title: 'Your Gloria',
    back: 'Back',
    periodTotal: (amount: number): string => compact(amount),
    periodTotalLabel: (amount: number, period: string): string => `${amount} Gloria, ${period}`,
    bestBar: (name: string, amount: number): string => `Best: ${name}, ${compact(amount)}`,
    describeBar: (name: string, amount: number): string => `${name}: ${amount} Gloria`,
    barValue: (name: string, amount: number): string => `${name} · ${compact(amount)} Gloria`,
    sources: {
      orders: 'Orders',
      conquered: 'Day conquered',
      todos: 'To-dos',
      focus: 'Focus',
      claims: 'Claims',
    },
    describeSource: (source: string, amount: number): string => `${source}, ${amount} Gloria`,
    outside: 'Before your journey began.',
    empty: {
      philosopher: 'No glory gathered here. Glory follows the work, quietly.',
      centurion: 'Zero Gloria in this stretch. Hold an order and it starts counting.',
      roast: 'A perfect zero. Even the feed earned more attention. Hold one order and fix it.',
    } satisfies ToneLines,
  },

  daySheet: {
    gloria: (amount: number): string => `+${amount} Gloria`,
    denarii: (amount: number): string => `${amount >= 0 ? '+' : ''}${amount} denarii`,
    focusTitle: 'Focus',
    focusTotal: (minutes: number): string => `${minutes} min held`,
    noFocus: 'No focus that day.',
    session: (guard: FocusGuard, minutes: number): string => `${GUARD_NAMES[guard]} · ${minutes} min`,
    results: { completed: 'Held', abandoned: 'Retreated', running: 'Running' },
    todosTitle: 'To-dos',
    empty: 'Nothing was logged on this day.',
    ringLabel: (name: string, detail: string): string => `${name}: ${detail}`,
  },

  ledger: {
    /** The treasury history's line for a claim's denarii. */
    claim: (reason: string): string | null => {
      const [kind, ...rest] = reason.split('_');
      const key = rest.join('_');
      if (kind === 'labour' && key in LABOUR_TITLES) return `Labour: ${LABOUR_TITLES[key as LabourId]}`;
      if (kind === 'decoration' && key in arcCopy.decorations.items)
        return `Decoration: ${arcCopy.decorations.items[key as DecorationId].name}`;
      return null;
    },
  },
} as const;

const GUARD_NAMES: Record<FocusGuard, string> = {
  custos: 'Custos (Watch)',
  imperium: 'Imperium (Limit)',
  silentium: 'Silentium (Lockdown)',
};

const LABOUR_TITLES: Record<LabourId, string> = Object.fromEntries(
  Object.entries(rewardsCopy.labours.items).map(([id, item]) => [id, item.title]),
) as Record<LabourId, string>;
