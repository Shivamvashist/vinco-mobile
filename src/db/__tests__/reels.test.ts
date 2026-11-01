import { saveReelDays, selectReelDaysBetween } from '../reels';
import { reelDays } from '../schema';
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
