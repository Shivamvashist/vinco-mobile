import { sql } from 'drizzle-orm';

import {
  checkPurchase,
  FORUM_ITEMS,
  type ForumItemId,
  getForumItem,
  type Holding,
  type PurchaseCheck,
} from '@/features/forum';
import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { type ItemUseRow, itemUses, ledger, type PurchaseRow, purchases, truces } from './schema';
import { getTruceReserve } from './truces';

/** Why a purchase was refused. */
export class ForumError extends Error {
  readonly reason: Exclude<PurchaseCheck, 'ok'>;

  constructor(reason: Exclude<PurchaseCheck, 'ok'>) {
    super(`Purchase refused: ${reason}`);
    this.name = 'ForumError';
    this.reason = reason;
  }
}

/** The query for every purchase. Pass to useLiveQuery. */
export function selectPurchases(db: AppDatabase) {
  return db.select().from(purchases);
}

/** The query for every consumable used. Pass to useLiveQuery. */
export function selectItemUses(db: AppDatabase) {
  return db.select().from(itemUses);
}

/** Denarii spent in the Forum. */
export function getForumSpend(db: AppDatabase): number {
  const row = db
    .select({ total: sql<number>`coalesce(sum(${purchases.price}), 0)` })
    .from(purchases)
    .get();
  return Number(row?.total ?? 0);
}

/** Denarii held now: the ledger (earned, minus Truces bought at the moment of need) minus the Forum. */
export function getDenariiBalance(db: AppDatabase): number {
  const row = db
    .select({ total: sql<number>`coalesce(sum(${ledger.amount}), 0)` })
    .from(ledger)
    .get();
  return Number(row?.total ?? 0) - getForumSpend(db);
}

/**
 * What the user holds of every item, from the rows. Truces come from their own reserve
 * (earned and bought alike); alarm passes are bought minus used; cosmetics are owned or not.
 */
export function toHoldings(
  purchaseRows: readonly Pick<PurchaseRow, 'itemId' | 'day'>[],
  useRows: readonly Pick<ItemUseRow, 'itemId'>[],
  truceReserve: number,
  today: DayKey,
): Record<ForumItemId, Holding> {
  const holdings = {} as Record<ForumItemId, Holding>;
  for (const item of FORUM_ITEMS) {
    const bought = purchaseRows.filter((row) => row.itemId === item.id);
    const used = useRows.filter((row) => row.itemId === item.id).length;
    holdings[item.id] = {
      held: item.id === 'truce' ? Math.max(0, truceReserve) : Math.max(0, bought.length - used),
      boughtToday: bought.filter((row) => row.day === today).length,
    };
  }
  return holdings;
}

/**
 * Buys an item with denarii, in one transaction: checks the balance and limits again, writes the
 * purchase and, for a Truce, adds it to the reserve. Throws ForumError when refused.
 */
export function buyItem(db: AppDatabase, itemId: ForumItemId, today: DayKey, now: Date = new Date()): void {
  db.transaction((tx) => {
    const item = getForumItem(itemId);
    const holding = toHoldings(
      tx.select().from(purchases).all(),
      tx.select().from(itemUses).all(),
      getTruceReserve(tx),
      today,
    )[itemId];
    const check = checkPurchase(item, getDenariiBalance(tx), holding);
    if (check !== 'ok') throw new ForumError(check);
    const createdAt = nowIso(now);
    tx.insert(purchases).values({ itemId, price: item.price, day: today, createdAt }).run();
    if (itemId === 'truce') {
      tx.insert(truces).values({ day: today, reason: 'forum', amount: 1, createdAt }).run();
    }
  });
}

/**
 * Uses one consumable (an alarm pass, when Aurora rings). Returns false when none is held.
 * Truces are spent through callTruce and callSickDay, never here.
 */
export function useItem(
  db: AppDatabase,
  itemId: Exclude<ForumItemId, 'truce'>,
  day: DayKey,
  now: Date = new Date(),
): boolean {
  return db.transaction((tx) => {
    const holding = toHoldings(tx.select().from(purchases).all(), tx.select().from(itemUses).all(), 0, day)[
      itemId
    ];
    if (getForumItem(itemId).kind !== 'consumable' || holding.held <= 0) return false;
    tx.insert(itemUses)
      .values({ itemId, day, createdAt: nowIso(now) })
      .run();
    return true;
  });
}
