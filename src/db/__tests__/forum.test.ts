import { buyItem, ForumError, getDenariiBalance, selectPurchases, toHoldings, useItem } from '../forum';
import { nowIso } from '../database';
import { ledger, truces } from '../schema';
import { createTestDatabase } from '../testing/testDatabase';
import { callSickDay, getTruceReserve } from '../truces';

const TODAY = '2026-10-12';

/** Puts earned denarii in the ledger. */
function earn(db: ReturnType<typeof createTestDatabase>, amount: number, day = '2026-10-01') {
  db.insert(ledger).values({ day, reason: 'day_conquered', amount, createdAt: nowIso() }).run();
}

function reasonOf(error: unknown): string | null {
  return error instanceof ForumError ? error.reason : null;
}

describe('the Forum', () => {
  it('buys a Truce into the reserve and takes the denarii', () => {
    const db = createTestDatabase();
    earn(db, 120);
    buyItem(db, 'truce', TODAY);
    expect(getTruceReserve(db)).toBe(1);
    expect(getDenariiBalance(db)).toBe(70);
  });

  it('sells one Truce a day and never past the reserve limit', () => {
    const db = createTestDatabase();
    earn(db, 1000);
    buyItem(db, 'truce', TODAY);
    let refused: unknown = null;
    try {
      buyItem(db, 'truce', TODAY);
    } catch (error) {
      refused = error;
    }
    expect(reasonOf(refused)).toBe('dailyLimit');
    db.insert(truces)
      .values({ day: '2026-10-01', reason: 'arc_start', amount: 2, createdAt: nowIso() })
      .run();
    expect(() => buyItem(db, 'truce', '2026-10-13')).toThrow(ForumError);
    expect(getDenariiBalance(db)).toBe(950);
  });

  it('refuses what cannot be afforded, and changes nothing', () => {
    const db = createTestDatabase();
    earn(db, 30);
    let refused: unknown = null;
    try {
      buyItem(db, 'venia', TODAY);
    } catch (error) {
      refused = error;
    }
    expect(reasonOf(refused)).toBe('cannotAfford');
    expect(selectPurchases(db).all()).toHaveLength(0);
    expect(getDenariiBalance(db)).toBe(30);
  });

  it('owns a cosmetic once', () => {
    const db = createTestDatabase();
    earn(db, 500);
    buyItem(db, 'cardAurum', TODAY);
    expect(() => buyItem(db, 'cardAurum', TODAY)).toThrow(ForumError);
    const holdings = toHoldings(selectPurchases(db).all(), [], 0, TODAY);
    expect(holdings.cardAurum.held).toBe(1);
    expect(holdings.cardNox.held).toBe(0);
  });

  it('uses an alarm pass once held, and not when none is', () => {
    const db = createTestDatabase();
    earn(db, 100);
    expect(useItem(db, 'venia', TODAY)).toBe(false);
    buyItem(db, 'venia', TODAY);
    expect(useItem(db, 'venia', TODAY)).toBe(true);
    expect(useItem(db, 'venia', TODAY)).toBe(false);
  });

  it('counts Forum spending in the balance a sick day pays from', () => {
    const db = createTestDatabase();
    earn(db, 90);
    buyItem(db, 'venia', TODAY);
    // 50 left, no Truces: a sick day costs exactly the 50.
    callSickDay(db, '2026-10-13');
    expect(getDenariiBalance(db)).toBe(0);
  });
});
