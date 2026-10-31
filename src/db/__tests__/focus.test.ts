import { nowIso } from '../database';
import {
  abandonFocus,
  FocusError,
  getRunningFocus,
  retreatFocus,
  selectFocusOn,
  settleFocus,
  startFocus,
} from '../focus';
import { getDenariiBalance } from '../forum';
import { clearJourney } from '../reset';
import { ledger, truces } from '../schema';
import { getTruceReserve } from '../truces';
import { createTestDatabase } from '../testing/testDatabase';

const TODAY = '2026-10-31';
const START = new Date('2026-10-31T10:00:00.000Z');
const at = (minutes: number) => new Date(START.getTime() + minutes * 60_000);

describe('focus sessions in the database', () => {
  it('starts a focus and refuses a second while it runs', () => {
    const db = createTestDatabase();
    const session = startFocus(db, { day: TODAY, guard: 'imperium', minutes: 25 }, START);
    expect(session.status).toBe('running');
    expect(session.endsAt).toBe(at(25).toISOString());
    expect(getRunningFocus(db)?.id).toBe(session.id);
    expect(() => startFocus(db, { day: TODAY, guard: 'custos', minutes: 15 }, at(1))).toThrow(FocusError);
  });

  it('keeps minutes on the rules and refuses an unknown guard', () => {
    const db = createTestDatabase();
    expect(startFocus(db, { day: TODAY, guard: 'custos', minutes: 999 }, START).minutes).toBe(180);
    expect(() => startFocus(db, { day: TODAY, guard: 'pax' as never, minutes: 25 }, START)).toThrow(
      FocusError,
    );
  });

  it('pays nothing when the focus is given up', () => {
    const db = createTestDatabase();
    const session = startFocus(db, { day: TODAY, guard: 'silentium', minutes: 60 }, START);
    expect(abandonFocus(db, session.id, at(10))?.status).toBe('abandoned');
    expect(abandonFocus(db, session.id, at(11))).toBeNull();
    expect(settleFocus(db, at(120))).toBeNull();
    expect(getDenariiBalance(db)).toBe(0);
    // A new focus can begin after giving up.
    expect(startFocus(db, { day: TODAY, guard: 'custos', minutes: 15 }, at(12)).status).toBe('running');
  });

  it('settles only when due, and pays once', () => {
    const db = createTestDatabase();
    startFocus(db, { day: TODAY, guard: 'imperium', minutes: 25 }, START);
    expect(settleFocus(db, at(24))).toBeNull();
    const settled = settleFocus(db, at(25));
    expect(settled).toMatchObject({ status: 'completed', reward: 8, endedAt: at(25).toISOString() });
    expect(settleFocus(db, at(26))).toBeNull();
    expect(getDenariiBalance(db)).toBe(8);
    expect(db.select().from(ledger).all()).toEqual([
      expect.objectContaining({ day: TODAY, reason: 'focus_1', amount: 8 }),
    ]);
  });

  it('pays on the day the focus began, even when settled days later', () => {
    const db = createTestDatabase();
    startFocus(db, { day: TODAY, guard: 'silentium', minutes: 60 }, START);
    expect(settleFocus(db, at(60 * 24 * 3))?.reward).toBe(24);
    expect(db.select().from(ledger).get()).toMatchObject({ day: TODAY, reason: 'focus_1' });
  });

  it('pays three sessions a day, then the fourth earns nothing', () => {
    const db = createTestDatabase();
    for (let index = 0; index < 4; index += 1) {
      const begin = at(index * 30);
      startFocus(db, { day: TODAY, guard: 'imperium', minutes: 25 }, begin);
      settleFocus(db, new Date(begin.getTime() + 25 * 60_000));
    }
    const rewards = selectFocusOn(db, TODAY)
      .all()
      .map((row) => row.reward);
    expect(rewards).toEqual([0, 8, 8, 8]);
    expect(getDenariiBalance(db)).toBe(24);
    // The next day starts fresh.
    startFocus(db, { day: '2026-11-01', guard: 'imperium', minutes: 25 }, at(200));
    expect(settleFocus(db, at(225))?.reward).toBe(8);
  });

  it('pays nothing under 10 minutes, and keeps the reason free', () => {
    const db = createTestDatabase();
    startFocus(db, { day: TODAY, guard: 'silentium', minutes: 5 }, START);
    expect(settleFocus(db, at(5))).toMatchObject({ status: 'completed', reward: 0 });
    startFocus(db, { day: TODAY, guard: 'imperium', minutes: 25 }, at(10));
    settleFocus(db, at(35));
    expect(db.select().from(ledger).get()).toMatchObject({ reason: 'focus_1', amount: 8 });
  });

  it('does not settle when the clock was set back before the start', () => {
    const db = createTestDatabase();
    startFocus(db, { day: TODAY, guard: 'imperium', minutes: 25 }, START);
    expect(settleFocus(db, at(-120))).toBeNull();
    expect(getRunningFocus(db)?.status).toBe('running');
  });

  it('is wiped with the journey', () => {
    const db = createTestDatabase();
    startFocus(db, { day: TODAY, guard: 'imperium', minutes: 25 }, START);
    clearJourney(db);
    expect(getRunningFocus(db)).toBeUndefined();
  });
});

describe('retreating from a focus', () => {
  type Db = ReturnType<typeof createTestDatabase>;
  const holdTruces = (db: Db, count: number) => {
    for (let index = 0; index < count; index += 1) {
      db.insert(truces)
        .values({ day: `2026-10-0${index + 1}`, reason: 'forum', amount: 1, createdAt: nowIso(START) })
        .run();
    }
  };
  const earn = (db: Db, amount: number) =>
    db
      .insert(ledger)
      .values({ day: '2026-01-01', reason: 'day_held', amount, createdAt: nowIso(START) })
      .run();

  it('spends one Truce per retreat, several times in one day without colliding', () => {
    const db = createTestDatabase();
    holdTruces(db, 2);
    const first = startFocus(db, { day: TODAY, guard: 'custos', minutes: 25 }, START);
    expect(retreatFocus(db, first.id, at(5))).toMatchObject({ status: 'retreated', paidWith: 'truce' });
    const second = startFocus(db, { day: TODAY, guard: 'imperium', minutes: 25 }, at(6));
    expect(retreatFocus(db, second.id, at(10))).toMatchObject({ status: 'retreated', paidWith: 'truce' });
    expect(getTruceReserve(db)).toBe(0);
    expect(
      selectFocusOn(db, TODAY)
        .all()
        .map((row) => [row.status, row.reward]),
    ).toEqual([
      ['abandoned', 0],
      ['abandoned', 0],
    ]);
  });

  it('buys a Truce on the spot for 50 denarii when none is held, once per session', () => {
    const db = createTestDatabase();
    earn(db, 120);
    const first = startFocus(db, { day: TODAY, guard: 'custos', minutes: 25 }, START);
    expect(retreatFocus(db, first.id, at(5))).toMatchObject({ paidWith: 'denarii' });
    // A second call for the same session finds nothing running and charges nothing.
    expect(retreatFocus(db, first.id, at(6))).toEqual({ status: 'none' });
    const second = startFocus(db, { day: TODAY, guard: 'custos', minutes: 25 }, at(7));
    expect(retreatFocus(db, second.id, at(8))).toMatchObject({ paidWith: 'denarii' });
    expect(getDenariiBalance(db)).toBe(20);
    expect(
      db
        .select()
        .from(ledger)
        .all()
        .filter((row) => row.amount < 0),
    ).toHaveLength(2);
  });

  it('asks for the stand-down when neither a Truce nor 50 denarii is held, and then retreats for free', () => {
    const db = createTestDatabase();
    earn(db, 49);
    const session = startFocus(db, { day: TODAY, guard: 'silentium', minutes: 60 }, START);
    expect(retreatFocus(db, session.id, at(5))).toEqual({ status: 'standDown' });
    expect(getRunningFocus(db)?.id).toBe(session.id);
    expect(retreatFocus(db, session.id, at(6), { afterStandDown: true })).toMatchObject({
      status: 'retreated',
      paidWith: 'standDown',
    });
    expect(getDenariiBalance(db)).toBe(49);
    expect(getRunningFocus(db)).toBeUndefined();
  });

  it('never pays a retreat, and a retreated focus never settles', () => {
    const db = createTestDatabase();
    holdTruces(db, 1);
    const session = startFocus(db, { day: TODAY, guard: 'imperium', minutes: 25 }, START);
    retreatFocus(db, session.id, at(24));
    expect(settleFocus(db, at(30))).toBeNull();
    expect(db.select().from(ledger).all()).toEqual([]);
  });
});
