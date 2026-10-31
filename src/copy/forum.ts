import type { ForumCategory, ForumItemId } from '@/features/forum';

/** The Forum (shop), the Aerarium (ways to earn) and the treasury's history. */
export const forumCopy = {
  eyebrow: 'The Forum · Shop',
  title: 'The Forum',
  back: 'Back',
  balance: (amount: number): string => `${amount} ${amount === 1 ? 'denarius' : 'denarii'}`,
  balanceLabel: 'In your purse',
  earnedThisWeek: (amount: number): string => `${amount} earned this week`,
  rule: 'Denarii are earned by holding the line. They are never sold for real money.',

  segments: { shop: 'Shop', earn: 'Earn', history: 'History' },

  categories: {
    supplies: 'Supplies',
    cards: 'Day cards',
    insignia: 'App icons',
  } satisfies Record<ForumCategory, string>,

  items: {
    truce: {
      name: 'Truce',
      latin: null,
      description: 'A rest day that keeps your campaign alive. Call it when a day falls.',
    },
    venia: {
      name: 'Alarm pass',
      latin: '"Venia" (pardon)',
      description: 'Stops Aurora once without its mission. For the morning you truly cannot.',
    },
    cardAurum: {
      name: 'Aurum card',
      latin: null,
      description: 'A day card in solid gold, for the days worth showing off.',
    },
    cardNox: {
      name: 'Nox card',
      latin: null,
      description: 'Black and gold, framed. For the night-watch crowd.',
    },
    designStamp: {
      name: 'Stamp card',
      latin: null,
      description: 'The seal slammed across your day. One word underneath.',
    },
    designMemento: {
      name: 'Memento card',
      latin: '"Memento" (remember)',
      description: 'One line worth keeping, and the day. Nothing else.',
    },
    iconLaurel: {
      name: 'Laurel icon',
      latin: null,
      description: 'The V in a gold laurel on your home screen.',
    },
    iconMarble: {
      name: 'Marble icon',
      latin: null,
      description: 'The V carved in marble on your home screen.',
    },
  } satisfies Record<ForumItemId, { name: string; latin: string | null; description: string }>,

  price: (amount: number): string => `${amount}`,
  priceLabel: (amount: number): string => `${amount} denarii`,
  status: {
    held: (count: number, max: number): string => `${count} of ${max} held`,
    owned: 'Owned',
    worksWithAurora: 'Works once Aurora arrives',
    worksWithBuild: 'Switches once app icons arrive in an update',
    onDayCard: 'Pick it on your day card',
    keptForCampaign: 'Kept for your next campaign (free training needs none)',
  },

  sheet: {
    balanceAfter: (amount: number): string => `Leaves ${amount} in your purse`,
    buy: (price: number): string => `Buy for ${price}`,
    needMore: (short: number): string => `Need ${short} more`,
    full: 'Reserve full',
    dailyLimit: 'One a day. Back tomorrow',
    owned: 'Owned',
    cancel: 'Not now',
    bought: (name: string): string => `${name} is yours.`,
    failed: 'The purchase did not go through. Nothing was spent.',
    truceRule: (max: number): string => `Hold up to ${max}. One can be bought each day.`,
    veniaRule: (max: number): string => `Hold up to ${max}. Kept until Aurora rings.`,
    cosmeticRule: 'Yours for good.',
  },

  earn: {
    title: 'The Aerarium',
    subtitle: '"Aerarium" (the treasury): every way to fill your purse.',
    ways: {
      dayHeld: 'Hold the line for a day',
      dayConquered: 'Conquer a day',
      streakWeek: 'Days 3, 5 and 7 of every week in a row',
      streakMilestone: 'Runs of 14, 30, 60 and 100 days',
      focus: 'Hold a focus to the end (up to three a day)',
      auroraFirstTry: 'Beat Aurora on the first try',
      underReelBudget: 'Stay under your reel budget',
      decorations: 'Earn a decoration',
    },
    amount: (value: number | { from: number; to: number }): string =>
      typeof value === 'number' ? `+${value}` : `+${value.from} to ${value.to}`,
    live: 'Live',
    soon: {
      aurora: 'With Aurora',
      vigil: 'With the Vigil',
      decorations: 'With decorations',
    },
    ludusNote: 'Free training pays the same denarii. Truces belong to campaigns.',
  },

  history: {
    empty: 'Nothing yet. Hold the line today and your first denarii land at once.',
    reasons: {
      day_held: 'Day held',
      day_conquered: 'Day conquered',
      campaign_week: 'Seven days of campaign',
      streak_day3: 'Day 3 in a row',
      streak_day5: 'Day 5 in a row',
      streak_day7: 'A full week in a row',
      streak_milestone: 'A long run',
      aurora_first_try: 'Aurora, first try',
      dev_grant: 'Dev grant',
      focus_1: 'Focus held',
      focus_2: 'Focus held',
      focus_3: 'Focus held',
      truce_bought: 'Truce, at the moment of need',
    } as Record<string, string>,
    purchase: (name: string): string => name,
    amount: (value: number): string => (value > 0 ? `+${value}` : `${value}`),
  },
} as const;
