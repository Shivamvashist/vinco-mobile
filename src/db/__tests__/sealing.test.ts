import { DEFAULT_ORDER_TARGETS, type OrderAmounts } from '@/features/orders';

import { getDayLog } from '../dayLogs';
import { saveOrderAmount } from '../orderLogs';
import {
  sealFinishedDays,
  selectDayLogsBetween,
  selectLedger,
  selectOrderLogsBetween,
  toDayRecords,
} from '../sealing';
import { createTestDatabase } from '../testing/testDatabase';

// Monday 12 October 2026 starts the week.
const ARC = { startDay: '2026-10-12', lengthDays: 30 };
const HELD: OrderAmounts = { water: 1, wake: 1, meal: 1, workout: 15 };
const CONQUERED: OrderAmounts = { water: 4, wake: 1, meal: 2, workout: 40 };

function logDay(db: ReturnType<typeof createTestDatabase>, day: string, amounts: OrderAmounts) {
  for (const [kind, amount] of Object.entries(amounts))
    saveOrderAmount(db, day, kind as keyof OrderAmounts, amount);
}

function ledgerTotal(db: ReturnType<typeof createTestDatabase>): number {
  return selectLedger(db)
    .all()
    .reduce((sum, row) => sum + row.amount, 0);
}

function results(db: ReturnType<typeof createTestDatabase>, to: string) {
  return toDayRecords(
    selectDayLogsBetween(db, ARC.startDay, to).all(),
    selectOrderLogsBetween(db, ARC.startDay, to).all(),
    DEFAULT_ORDER_TARGETS,
  ).map((record) => record.result);
}

describe('sealFinishedDays', () => {
  it('seals nothing on Day I', () => {
    const db = createTestDatabase();
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-12');
    expect(getDayLog(db, '2026-10-12')).toBeUndefined();
  });

  it('seals past days, uses the week Truce on the first miss only, and pays denarii', () => {
    const db = createTestDatabase();
    logDay(db, '2026-10-12', CONQUERED);
    logDay(db, '2026-10-13', HELD);
    // 14th and 15th: nothing done.
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-16');

    expect(results(db, '2026-10-15')).toEqual(['conquered', 'held', 'truce', 'missed']);
    expect(getDayLog(db, '2026-10-14')?.truceUsed).toBe(true);
    expect(getDayLog(db, '2026-10-15')?.truceUsed).toBe(false);
    expect(ledgerTotal(db)).toBe(15);
  });

  it('gives a new Truce in a new week', () => {
    const db = createTestDatabase();
    // Sunday 18 missed (takes week 1's Truce), Monday 19 missed (takes week 2's).
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-20');
    const days = results(db, '2026-10-19');
    expect(days.slice(0, 1)).toEqual(['truce']);
    expect(days.slice(-1)).toEqual(['truce']);
  });

  it('never pays twice or re-seals a day', () => {
    const db = createTestDatabase();
    logDay(db, '2026-10-12', HELD);
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-13');
    const firstSeal = getDayLog(db, '2026-10-12')?.sealedAt;
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-13', new Date('2030-01-01'));
    expect(ledgerTotal(db)).toBe(5);
    expect(getDayLog(db, '2026-10-12')?.sealedAt).toBe(firstSeal);
  });

  it('adds the 7-day campaign bonus', () => {
    const db = createTestDatabase();
    for (let day = 12; day <= 18; day += 1) logDay(db, `2026-10-${day}`, HELD);
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-19');
    expect(ledgerTotal(db)).toBe(7 * 5 + 25);
  });

  it('stops at the end of the arc', () => {
    const db = createTestDatabase();
    sealFinishedDays(db, { startDay: '2026-10-12', lengthDays: 3 }, DEFAULT_ORDER_TARGETS, '2026-10-30');
    expect(getDayLog(db, '2026-10-14')?.sealedAt).toBeTruthy();
    expect(getDayLog(db, '2026-10-15')).toBeUndefined();
  });

  it('seals nothing when the clock is before the arc', () => {
    const db = createTestDatabase();
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-01');
    expect(selectDayLogsBetween(db, '2026-01-01', '2027-01-01').all()).toEqual([]);
  });
});
