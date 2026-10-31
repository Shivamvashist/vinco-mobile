import { DEFAULT_ORDER_TARGETS, type OrderAmounts } from '@/features/orders';

import { createArc } from '../arcs';
import { ClaimError, claimDecoration, claimLabour } from '../claims';
import { updateDayLog } from '../dayLogs';
import { getDenariiBalance } from '../forum';
import { selectClaims } from '../journey';
import { saveOrderAmount } from '../orderLogs';
import { clearJourney } from '../reset';
import { claims, ledger, truces } from '../schema';
import { createTestDatabase } from '../testing/testDatabase';
import { getTruceReserve } from '../truces';

const MONDAY = '2026-10-26';
const SATURDAY = '2026-10-31';
const SUNDAY = '2026-11-01';
const NEXT_MONDAY = '2026-11-02';
const CONQUERED: OrderAmounts = { water: 4, wake: 1, meal: 2, workout: 40 };

type Db = ReturnType<typeof createTestDatabase>;

function setup(kind: 'campaign' | 'ludus' = 'campaign'): Db {
  const db = createTestDatabase();
  createArc(db, {
    kind,
    lengthDays: 30,
    startDay: MONDAY,
    wakeTime: '06:30',
    targets: DEFAULT_ORDER_TARGETS,
    oathPath: null,
  });
  return db;
}

function logDay(db: Db, day: string, amounts: OrderAmounts) {
  for (const [kind, amount] of Object.entries(amounts))
    saveOrderAmount(db, day, kind as keyof OrderAmounts, amount);
}

function refusal(write: () => unknown): string | null {
  try {
    write();
    return null;
  } catch (error) {
    return error instanceof ClaimError ? error.reason : 'other';
  }
}

describe('claimLabour', () => {
  it('pays once: the claim, its denarii in the ledger, and the balance', () => {
    const db = setup();
    const before = getDenariiBalance(db);
    updateDayLog(db, SATURDAY, { selfiePath: 'file:///selfie.jpg' });
    const pay = claimLabour(db, 'selfie', SATURDAY);
    expect(pay).toMatchObject({ denarii: 3, gloria: 10, truces: 0 });
    expect(getDenariiBalance(db)).toBe(before + 3);
    expect(db.select().from(ledger).all()).toContainEqual(
      expect.objectContaining({ day: SATURDAY, reason: 'labour_selfie', amount: 3 }),
    );
    // A double tap is refused and pays nothing more.
    expect(refusal(() => claimLabour(db, 'selfie', SATURDAY))).toBe('claimed');
    expect(getDenariiBalance(db)).toBe(before + 3);
    expect(selectClaims(db).all()).toHaveLength(1);
  });

  it('refuses a labour that is not done, or was undone before the claim', () => {
    const db = setup();
    expect(refusal(() => claimLabour(db, 'selfie', SATURDAY))).toBe('incomplete');
    logDay(db, SATURDAY, CONQUERED);
    saveOrderAmount(db, SATURDAY, 'water', 1);
    expect(refusal(() => claimLabour(db, 'conquer', SATURDAY))).toBe('incomplete');
    expect(db.select().from(claims).all()).toHaveLength(0);
    expect(
      db
        .select()
        .from(ledger)
        .all()
        .filter((row) => row.reason.startsWith('labour_')),
    ).toEqual([]);
  });

  it('pays a daily labour again the next day, and refuses a period that has passed', () => {
    const db = setup();
    updateDayLog(db, SATURDAY, { weightKg: 80 });
    claimLabour(db, 'weight', SATURDAY);
    // Sunday has no weight yet: yesterday's deed does not carry over.
    expect(refusal(() => claimLabour(db, 'weight', SUNDAY))).toBe('incomplete');
    updateDayLog(db, SUNDAY, { weightKg: 79.5 });
    expect(claimLabour(db, 'weight', SUNDAY).denarii).toBe(3);
  });

  it('pays a weekly labour once a week, Monday to Sunday', () => {
    const db = setup();
    for (const day of ['2026-10-27', '2026-10-28', '2026-10-29']) logDay(db, day, CONQUERED);
    const pay = claimLabour(db, 'conquerWeek', SATURDAY);
    expect(pay).toMatchObject({ denarii: 20, truces: 1 });
    expect(refusal(() => claimLabour(db, 'conquerWeek', SUNDAY))).toBe('claimed');
    // A new week starts from nothing.
    expect(refusal(() => claimLabour(db, 'conquerWeek', NEXT_MONDAY))).toBe('incomplete');
  });

  it('grants a Truce into the reserve, or its price in denarii when the reserve is full', () => {
    const db = setup();
    for (const day of ['2026-10-27', '2026-10-28', '2026-10-29']) logDay(db, day, CONQUERED);
    const reserve = getTruceReserve(db);
    claimLabour(db, 'conquerWeek', SATURDAY);
    expect(getTruceReserve(db)).toBe(reserve + 1);
    expect(db.select().from(truces).all()).toContainEqual(
      expect.objectContaining({ day: SATURDAY, reason: 'claim_labour_conquerWeek', amount: 1 }),
    );

    const full = setup();
    full.insert(truces).values({ day: MONDAY, reason: 'bought', amount: 2, createdAt: '' }).run();
    for (const day of ['2026-10-27', '2026-10-28', '2026-10-29']) logDay(full, day, CONQUERED);
    const pay = claimLabour(full, 'conquerWeek', SATURDAY);
    expect(pay).toMatchObject({ denarii: 70, truces: 0, trucesConverted: 1 });
    expect(getTruceReserve(full)).toBe(3);
  });

  it('keeps two claims on one day apart in the ledger', () => {
    const db = setup();
    updateDayLog(db, SATURDAY, { selfiePath: 'file:///s.jpg', weightKg: 80 });
    logDay(db, SATURDAY, CONQUERED);
    claimLabour(db, 'selfie', SATURDAY);
    claimLabour(db, 'weight', SATURDAY);
    claimLabour(db, 'conquer', SATURDAY);
    const reasons = db
      .select()
      .from(ledger)
      .all()
      .filter((row) => row.day === SATURDAY)
      .map((row) => row.reason);
    expect(reasons).toEqual(expect.arrayContaining(['labour_selfie', 'labour_weight', 'labour_conquer']));
  });

  it("needs orders to conquer: free training with nothing picked can't", () => {
    const db = createTestDatabase();
    createArc(db, {
      kind: 'ludus',
      lengthDays: 3650,
      startDay: MONDAY,
      wakeTime: '06:30',
      targets: {},
      oathPath: null,
    });
    expect(refusal(() => claimLabour(db, 'conquer', SATURDAY))).toBe('unavailable');
  });
});

describe('claimDecoration', () => {
  it('pays an earned decoration once, forever', () => {
    const db = setup();
    logDay(db, SATURDAY, CONQUERED);
    expect(claimDecoration(db, 'conqueror', SATURDAY).denarii).toBe(20);
    expect(refusal(() => claimDecoration(db, 'conqueror', SUNDAY))).toBe('claimed');
  });

  it('refuses a locked one', () => {
    const db = setup();
    expect(refusal(() => claimDecoration(db, 'proofKeeper', SATURDAY))).toBe('incomplete');
  });
});

describe('reset', () => {
  it('clears every claim with the journey', () => {
    const db = setup();
    updateDayLog(db, SATURDAY, { selfiePath: 'file:///s.jpg' });
    claimLabour(db, 'selfie', SATURDAY);
    clearJourney(db);
    expect(db.select().from(claims).all()).toEqual([]);
    expect(getDenariiBalance(db)).toBe(0);
  });
});
