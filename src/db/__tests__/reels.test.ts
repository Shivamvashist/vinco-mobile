import { nowIso } from '../database';
import { getDenariiBalance } from '../forum';
import { buyReelPass, ReelPassError, saveReelDays, selectReelDaysBetween, selectReelPasses } from '../reels';
import { ledger, reelDays } from '../schema';
import { createTestDatabase } from '../testing/testDatabase';

const NOW = new Date('2026-11-01T10:00:00Z');
const LATER = new Date('2026-11-01T11:00:00Z');

describe('reel days in the database', () => {
  it('copies the phone counts and takes the native count as it is', () => {
    const db = createTestDatabase();
    saveReelDays(
      db,
      [
        { day: '2026-10-31', count: 41 },
        { day: '2026-11-01', count: 3 },
      ],
      NOW,
    );
    saveReelDays(db, [{ day: '2026-11-01', count: 4 }], LATER);
    expect(selectReelDaysBetween(db, '2026-10-31', '2026-11-01').all()).toEqual([
      { day: '2026-10-31', count: 41, updatedAt: NOW.toISOString() },
      { day: '2026-11-01', count: 4, updatedAt: LATER.toISOString() },
    ]);
  });

  it('leaves a row alone when its count has not changed', () => {
    const db = createTestDatabase();
    saveReelDays(db, [{ day: '2026-11-01', count: 3 }], NOW);
    saveReelDays(db, [{ day: '2026-11-01', count: 3 }], LATER);
    expect(db.select().from(reelDays).get()?.updatedAt).toBe(NOW.toISOString());
  });

  it('keeps days the phone no longer lists, and selects only the range', () => {
    const db = createTestDatabase();
    saveReelDays(db, [{ day: '2026-08-01', count: 9 }], NOW);
    saveReelDays(db, [], LATER);
    saveReelDays(db, [{ day: '2026-11-01', count: 1 }], LATER);
    expect(selectReelDaysBetween(db, '2026-10-31', '2026-11-01').all()).toHaveLength(1);
    expect(db.select().from(reelDays).all()).toHaveLength(2);
  });
});

describe('reel passes', () => {
  const DAY = '2026-11-01';

  function earn(db: ReturnType<typeof createTestDatabase>, amount: number) {
    db.insert(ledger)
      .values({ day: '2026-10-01', reason: 'day_conquered', amount, createdAt: nowIso() })
      .run();
  }

  function refusal(run: () => void): string | null {
    try {
      run();
    } catch (error) {
      return error instanceof ReelPassError ? error.reason : null;
    }
    return null;
  }

  it('takes 20 denarii from the ledger, one reason per pass', () => {
    const db = createTestDatabase();
    earn(db, 50);
    expect(buyReelPass(db, DAY, 0, NOW)).toBe('bought');
    expect(getDenariiBalance(db)).toBe(30);
    expect(selectReelPasses(db).all()).toEqual([{ day: DAY, reason: 'reel_pass_1' }]);
  });

  it('buys once on a double tap (the count the user saw)', () => {
    const db = createTestDatabase();
    earn(db, 100);
    buyReelPass(db, DAY, 0, NOW);
    expect(buyReelPass(db, DAY, 0, NOW)).toBe('alreadyBought');
    expect(getDenariiBalance(db)).toBe(80);
  });

  it('stops at three a day, and starts again the next day', () => {
    const db = createTestDatabase();
    earn(db, 200);
    for (const seen of [0, 1, 2]) buyReelPass(db, DAY, seen, NOW);
    expect(refusal(() => buyReelPass(db, DAY, 3, NOW))).toBe('dailyLimit');
    expect(buyReelPass(db, '2026-11-02', 0, NOW)).toBe('bought');
    expect(getDenariiBalance(db)).toBe(120);
  });

  it('never goes below zero', () => {
    const db = createTestDatabase();
    earn(db, 19);
    expect(refusal(() => buyReelPass(db, DAY, 0, NOW))).toBe('cannotAfford');
    expect(getDenariiBalance(db)).toBe(19);
  });
});
