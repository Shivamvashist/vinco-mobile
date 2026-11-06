import type { ForumCategory, ForumItemId } from '@/features/forum';

/**
 * The Shop (route /shop; "the Forum" in code), its Earn tab and the history of every denarius.
 * Plain names first: the Roman ones confused people (2 Nov).
 */
export const shopCopy = {
  eyebrow: 'Spend and earn',
  title: 'Shop',
  back: 'Back',
  balance: (amount: number): string => `${amount} ${amount === 1 ? 'denarius' : 'denarii'}`,
  balanceLabel: 'Your denarii',
  earnedThisWeek: (amount: number): string => `+${amount} this week`,
  earnedThisWeekLabel: (amount: number): string => `${amount} earned in the last 7 days`,
  earnMore: 'Earn more',
  rule: 'Denarii are earned, never sold for real money.',

  segments: { shop: 'Shop', earn: 'Earn', history: 'History' },
  /** Spoken with the Earn tab when quests wait: "2 ready to claim". */
  readyBadge: (count: number): string => `${count} ready to claim`,

  categories: {
    supplies: 'Essentials',
    cards: 'Day cards',
    insignia: 'App icons',
  } satisfies Record<ForumCategory, string>,
  categoryNotes: {
    supplies: 'Used up when they save you.',
    cards: 'Pick one on your day card.',
    insignia: 'A new look on your home screen.',
  } satisfies Record<ForumCategory, string>,

  items: {
    truce: {
      name: 'Truce',
      latin: null,
      description: 'A rest day that keeps your campaign alive.',
    },
    venia: {
      name: 'Alarm pass',
      latin: '"Venia" (pardon)',
      description: 'Stops Aurora once without its mission.',
    },
    cardAurum: {
      name: 'Aurum card',
      latin: null,
      description: 'A day card in solid gold.',
    },
    cardNox: {
      name: 'Nox card',
      latin: null,
      description: 'Black and gold, framed.',
    },
    designStamp: {
      name: 'Stamp card',
      latin: null,
      description: 'The seal slammed across your day.',
    },
    designMemento: {
      name: 'Memento card',
      latin: '"Memento" (remember)',
      description: 'One line worth keeping, and the day.',
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
    worksWithBuild: 'Switches on in an update',
    onDayCard: 'Pick it on your day card',
    keptForCampaign: 'Kept for your next campaign',
  },

  sheet: {
    price: 'Price',
    inPurse: 'In your purse',
    leftAfter: 'Left after',
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
    title: 'More ways to earn',
    subtitle: 'These pay on their own as you go.',
    ways: {
      dayHeld: 'Hold the line for a day',
      dayConquered: 'Conquer a day',
      streakWeek: 'Days 3, 5 and 7 of every week in a row',
      streakMilestone: 'Runs of 14, 30, 60 and 100 days',
      focus: 'Hold a focus to the end (up to three a day)',
      auroraFirstTry: 'Beat Aurora on the first try',
      underReelBudget: 'Stay under your reel budget',
      decorations: 'Claim a decoration (on Vici)',
    },
    amount: (value: number | { from: number; to: number }): string =>
      typeof value === 'number' ? `+${value}` : `+${value.from} to ${value.to}`,
    live: 'Live',
    soon: {
      aurora: 'With Aurora',
      vigil: 'With the Vigil',
      decorations: 'With decorations',
    },
    ludusNote: 'Truces belong to campaigns.',
  },

  history: {
    empty: 'Nothing yet. Hold the line today to earn your first.',
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
      reel_pass_1: 'Reel pass, 12 more reels',
      reel_pass_2: 'Reel pass, 12 more reels',
      reel_pass_3: 'Reel pass, 12 more reels',
    } as Record<string, string>,
    /** A retreat from a focus paid in denarii (a Truce bought on the spot). */
    focusRetreat: 'Focus retreat, Truce bought on the spot',
    purchase: (name: string): string => name,
    amount: (value: number): string => (value > 0 ? `+${value}` : `${value}`),
  },
} as const;
