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
      campaignWeek: 'Every 7 days of campaign',
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
    ludusNote: 'In free training, held and conquered days still pay. The weekly bonus belongs to campaigns.',
  },

  history: {
    empty: 'Nothing yet. Hold the line today and your first denarii land at midnight.',
    reasons: {
      day_held: 'Day held',
      day_conquered: 'Day conquered',
      campaign_week: 'Seven days of campaign',
      truce_bought: 'Truce, at the moment of need',
    } as Record<string, string>,
    purchase: (name: string): string => name,
    amount: (value: number): string => (value > 0 ? `+${value}` : `${value}`),
  },
} as const;
