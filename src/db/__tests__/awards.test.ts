import { DEFAULT_ORDER_TARGETS, type OrderAmounts } from '@/features/orders';

import { createArc } from '../arcs';
import { grantDevDenarii, syncTodayAwards } from '../awards';
import { getDenariiBalance } from '../forum';
import { saveOrderAmount } from '../orderLogs';
import { sealFinishedDays, selectLedger } from '../sealing';
import { createTestDatabase } from '../testing/testDatabase';

const START = '2026-10-12';
const HELD: OrderAmounts = { water: 1, wake: 1, meal: 1, workout: 15 };
const CONQUERED: OrderAmounts = { water: 4, wake: 1, meal: 2, workout: 40 };
const NOTHING: OrderAmounts = { water: 0, wake: 0, meal: 0, workout: 0 };

type Db = ReturnType<typeof createTestDatabase>;

function setup(kind: 'campaign' | 'ludus' = 'campaign'): Db {
  const db = createTestDatabase();
  createArc(db, {
    kind,
    lengthDays: 30,
    startDay: START,
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

function earnedOn(db: Db, day: string): number {
  return selectLedger(db)
    .all()
    .filter((row) => row.day === day)
    .reduce((sum, row) => sum + row.amount, 0);
}

describe('syncTodayAwards', () => {
  it('pays when today holds and takes it back when it stops holding', () => {
    const db = setup();
    logDay(db, START, HELD);
    expect(syncTodayAwards(db, START, DEFAULT_ORDER_TARGETS)).toBe(5);
    logDay(db, START, CONQUERED);
    expect(syncTodayAwards(db, START, DEFAULT_ORDER_TARGETS)).toBe(5);
    expect(earnedOn(db, START)).toBe(10);
    logDay(db, START, NOTHING);
    expect(syncTodayAwards(db, START, DEFAULT_ORDER_TARGETS)).toBe(-10);
    expect(earnedOn(db, START)).toBe(0);
  });

  it('is safe to run again: nothing changes', () => {
    const db = setup();
    logDay(db, START, HELD);
    syncTodayAwards(db, START, DEFAULT_ORDER_TARGETS);
    expect(syncTodayAwards(db, START, DEFAULT_ORDER_TARGETS)).toBe(0);
    expect(earnedOn(db, START)).toBe(5);
  });

  it('adds the run pay from the sealed days before today', () => {
    const db = setup('ludus');
    logDay(db, '2026-10-12', HELD);
    logDay(db, '2026-10-13', HELD);
    sealFinishedDays(
      db,
      { startDay: START, lengthDays: 30, kind: 'ludus' },
      DEFAULT_ORDER_TARGETS,
      '2026-10-14',
    );
    logDay(db, '2026-10-14', HELD);
    // Day 3 of the run: 5 for the day and 10 for the run.
    expect(syncTodayAwards(db, '2026-10-14', DEFAULT_ORDER_TARGETS)).toBe(15);
  });

  it('is replaced, never doubled, by the midnight seal', () => {
    const db = setup();
    logDay(db, START, CONQUERED);
    syncTodayAwards(db, START, DEFAULT_ORDER_TARGETS);
    sealFinishedDays(db, { startDay: START, lengthDays: 30 }, DEFAULT_ORDER_TARGETS, '2026-10-13');
    expect(earnedOn(db, START)).toBe(10);
  });

  it('pays nothing before the arc starts', () => {
    const db = setup();
    logDay(db, '2026-10-11', HELD);
    expect(syncTodayAwards(db, '2026-10-11', DEFAULT_ORDER_TARGETS)).toBe(0);
  });

  it('pays nothing after the arc has ended', () => {
    const db = setup();
    // A 30-day arc from 12 October ends on 10 November.
    logDay(db, '2026-11-11', HELD);
    expect(syncTodayAwards(db, '2026-11-11', DEFAULT_ORDER_TARGETS)).toBe(0);
  });

  it('never touches dev, Forum or Truce rows', () => {
    const db = setup();
    grantDevDenarii(db, START);
    logDay(db, START, HELD);
    syncTodayAwards(db, START, DEFAULT_ORDER_TARGETS);
    logDay(db, START, NOTHING);
    syncTodayAwards(db, START, DEFAULT_ORDER_TARGETS);
    expect(getDenariiBalance(db)).toBe(100);
  });
});

describe('grantDevDenarii', () => {
  it('adds up on the same day', () => {
    const db = setup();
    expect(grantDevDenarii(db, START)).toBe(100);
    expect(grantDevDenarii(db, START)).toBe(200);
    expect(getDenariiBalance(db)).toBe(200);
  });
});
