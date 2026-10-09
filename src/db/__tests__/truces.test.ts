import { DEFAULT_ORDER_TARGETS, type OrderAmounts } from '@/features/orders';
import { TRUCES } from '@/features/campaign';

import { createArc } from '../arcs';
import { getDayLog, updateDayLog } from '../dayLogs';
import { saveOrderAmount } from '../orderLogs';
import { clearJourney } from '../reset';
import { sealFinishedDays, selectDayLogsBetween } from '../sealing';
import { createTestDatabase } from '../testing/testDatabase';
import { callTruce, getDenariiBalance, getTruceReserve, grantTruce, TruceError } from '../truces';

const ARC = { startDay: '2026-10-12', lengthDays: 30 };
const HELD: OrderAmounts = { water: 1, wake: 1, meal: 1, workout: 15 };

function logDay(db: ReturnType<typeof createTestDatabase>, day: string, amounts: OrderAmounts) {
  for (const [kind, amount] of Object.entries(amounts))
    saveOrderAmount(db, day, kind as keyof OrderAmounts, amount);
}

function startArc(db: ReturnType<typeof createTestDatabase>) {
  createArc(db, {
    ...ARC,
    wakeTime: '06:30',
    targets: DEFAULT_ORDER_TARGETS,
    oathPath: null,
  });
}

describe('Truce reserve', () => {
  it('grants one Truce when an arc begins, once', () => {
    const db = createTestDatabase();
    startArc(db);
    expect(getTruceReserve(db)).toBe(1);
    expect(grantTruce(db, ARC.startDay, 'arc_start')).toBe(false);
    expect(getTruceReserve(db)).toBe(1);
  });

  it('never grows past the limit', () => {
    const db = createTestDatabase();
    for (let day = 10; day < 10 + TRUCES.maxHeld + 2; day += 1)
      grantTruce(db, `2026-10-${day}`, 'campaign_week');
    expect(getTruceReserve(db)).toBe(TRUCES.maxHeld);
  });
});

describe('callTruce', () => {
  it('spends the reserve on a missed day and keeps the campaign', () => {
    const db = createTestDatabase();
    startArc(db);
    logDay(db, '2026-10-12', HELD);
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-14');

    const payment = callTruce(db, ['2026-10-13']);
    expect(payment).toMatchObject({ fromReserve: 1, toBuy: 0, cost: 0 });
    expect(getDayLog(db, '2026-10-13')?.truceUsed).toBe(true);
    expect(getTruceReserve(db)).toBe(0);
    expect(getDenariiBalance(db)).toBe(5);
  });

  it('buys with denarii when the reserve is empty, and refuses when short', () => {
    const db = createTestDatabase();
    for (let day = 12; day <= 21; day += 1) logDay(db, `2026-10-${day}`, HELD);
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-23');
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-24');
    // 10 held days (50) plus the week bonus (25) = 75 denarii, and one Truce earned on day 7.
    expect(getDenariiBalance(db)).toBe(75);
    expect(getTruceReserve(db)).toBe(1);

    // Two missed days (22nd, 23rd): one from the reserve, one bought.
    const payment = callTruce(db, ['2026-10-23', '2026-10-22']);
    expect(payment).toMatchObject({ fromReserve: 1, toBuy: 1, cost: TRUCES.priceDenarii });
    expect(getDenariiBalance(db)).toBe(75 - TRUCES.priceDenarii);
    expect(getTruceReserve(db)).toBe(0);

    // A third miss can't be afforded: nothing changes.
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-25');
    expect(() => callTruce(db, ['2026-10-24'])).toThrow(TruceError);
    expect(getDayLog(db, '2026-10-24')?.truceUsed).toBe(false);
    expect(getDenariiBalance(db)).toBe(75 - TRUCES.priceDenarii);
  });

  it('pays once even when called twice', () => {
    const db = createTestDatabase();
    startArc(db);
    logDay(db, '2026-10-12', HELD);
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-14');
    callTruce(db, ['2026-10-13']);
    expect(() => callTruce(db, ['2026-10-13'])).toThrow(TruceError);
    expect(getTruceReserve(db)).toBe(0);
  });

  it('refuses days that are not sealed, and empty lists', () => {
    const db = createTestDatabase();
    startArc(db);
    updateDayLog(db, '2026-10-12', { wokeAt: '2026-10-12T06:00:00.000Z' });
    expect(() => callTruce(db, ['2026-10-12'])).toThrow(TruceError);
    expect(() => callTruce(db, [])).toThrow(TruceError);
    expect(getTruceReserve(db)).toBe(1);
  });
});

describe('clearJourney', () => {
  it('deletes every record', () => {
    const db = createTestDatabase();
    startArc(db);
    logDay(db, '2026-10-12', HELD);
    sealFinishedDays(db, ARC, DEFAULT_ORDER_TARGETS, '2026-10-14');
    clearJourney(db);
    expect(getTruceReserve(db)).toBe(0);
    expect(getDenariiBalance(db)).toBe(0);
    expect(selectDayLogsBetween(db, '2000-01-01', '2100-01-01').all()).toEqual([]);
  });
});
