import { DENARII, TRUCES } from '@/features/campaign';

/**
 * The Forum: what denarii buy. Denarii are earned, never bought with real money, and nothing
 * here can be bought with real money either. Prices are tunable with Early Access data.
 * See docs/WAVE-2.md, section 3.
 */
export type ForumItemId = 'truce' | 'venia' | 'iconLaurel' | 'iconMarble' | 'cardAurum' | 'cardNox';

/** supplies: used up. insignia: app icons. cards: day card styles. */
export type ForumCategory = 'supplies' | 'insignia' | 'cards';

export type ForumItem = {
  id: ForumItemId;
  category: ForumCategory;
  price: number;
  /** consumable: held up to maxHeld, used up. cosmetic: owned once, forever. */
  kind: 'consumable' | 'cosmetic';
  /** Most held at once (consumables). */
  maxHeld: number;
  /**
   * now: works today. native: owned now, takes effect with the native build (app icons need it,
   * the alarm pass needs Aurora). See docs/GUARDIANS.md.
   */
  works: 'now' | 'native';
};

export const FORUM_ITEMS: readonly ForumItem[] = [
  {
    id: 'truce',
    category: 'supplies',
    price: TRUCES.priceDenarii,
    kind: 'consumable',
    maxHeld: TRUCES.maxHeld,
    works: 'now',
  },
  { id: 'venia', category: 'supplies', price: 40, kind: 'consumable', maxHeld: 2, works: 'native' },
  { id: 'cardAurum', category: 'cards', price: 150, kind: 'cosmetic', maxHeld: 1, works: 'now' },
  { id: 'cardNox', category: 'cards', price: 150, kind: 'cosmetic', maxHeld: 1, works: 'now' },
  { id: 'iconLaurel', category: 'insignia', price: 200, kind: 'cosmetic', maxHeld: 1, works: 'native' },
  { id: 'iconMarble', category: 'insignia', price: 200, kind: 'cosmetic', maxHeld: 1, works: 'native' },
];

/** One Truce can be bought per day from the Forum (they're a safety net, not a stockpile). */
export const TRUCES_BOUGHT_PER_DAY = 1;

export function isForumItemId(value: unknown): value is ForumItemId {
  return FORUM_ITEMS.some((item) => item.id === value);
}

export function getForumItem(id: ForumItemId): ForumItem {
  const item = FORUM_ITEMS.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown Forum item: ${id}`);
  return item;
}

/** What the user holds of an item now, and how many they bought today. */
export type Holding = { held: number; boughtToday: number };

export type PurchaseCheck = 'ok' | 'cannotAfford' | 'full' | 'owned' | 'dailyLimit';

/** Whether an item can be bought now, and if not, why. Checked again inside the purchase. */
export function checkPurchase(item: ForumItem, balance: number, holding: Holding): PurchaseCheck {
  if (item.kind === 'cosmetic' && holding.held > 0) return 'owned';
  if (item.kind === 'consumable' && holding.held >= item.maxHeld) return 'full';
  if (item.id === 'truce' && holding.boughtToday >= TRUCES_BOUGHT_PER_DAY) return 'dailyLimit';
  if (!Number.isFinite(balance) || balance < item.price) return 'cannotAfford';
  return 'ok';
}

/** How many more denarii are needed for an item (0 when affordable). */
export function denariiShort(item: ForumItem, balance: number): number {
  return Math.max(0, item.price - Math.max(0, Math.floor(Number.isFinite(balance) ? balance : 0)));
}

/** live: pays now. aurora, vigil, decorations: pays once that feature arrives. */
export type EarnSource = 'live' | 'aurora' | 'vigil' | 'decorations';

export type EarnWay = {
  id: 'dayHeld' | 'dayConquered' | 'campaignWeek' | 'auroraFirstTry' | 'underReelBudget' | 'decorations';
  /** A fixed amount, or a range for decorations. */
  amount: number | { from: number; to: number };
  source: EarnSource;
};

/** Every way to earn denarii, live ones first. Amounts match the ledger rules. */
export const EARN_WAYS: readonly EarnWay[] = [
  { id: 'dayHeld', amount: DENARII.dayHeld, source: 'live' },
  { id: 'dayConquered', amount: DENARII.dayConquered, source: 'live' },
  { id: 'campaignWeek', amount: DENARII.campaignWeek, source: 'live' },
  { id: 'auroraFirstTry', amount: 2, source: 'aurora' },
  { id: 'underReelBudget', amount: 3, source: 'vigil' },
  { id: 'decorations', amount: { from: 10, to: 100 }, source: 'decorations' },
];
