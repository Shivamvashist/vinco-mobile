import { FEATURES } from '@/config/features';
import { CUSTOM_ORDER_LIMITS, DEFAULT_ORDER_TARGETS, type OrderAmounts } from '@/features/orders';

import { createArc } from '../arcs';
import {
  addCustomOrder,
  CustomOrderError,
  getCustomOrdersWithAmounts,
  saveCustomOrderAmount,
  selectCustomOrders,
  standDownCustomOrder,
} from '../customOrders';
import { getDayLog } from '../dayLogs';
import { getDayStanding } from '../dayStanding';
import { saveOrderAmount } from '../orderLogs';
import { sealFinishedDays, selectDayLogsBetween, selectOrderLogsBetween, toDayRecords } from '../sealing';
import { createTestDatabase } from '../testing/testDatabase';

const START = '2026-10-12';

// Built but switched off in the app; these tests cover it switched on.
beforeEach(() => jest.replaceProperty(FEATURES, 'customOrders', true));
afterEach(() => jest.restoreAllMocks());
const HELD: OrderAmounts = { water: 1, wake: 1, meal: 1, workout: 15 };
const CONQUERED: OrderAmounts = { water: 4, wake: 1, meal: 2, workout: 40 };
const READ = { name: '  Read ', unit: 'pages', min: 10, full: 30 };

function setup() {
  const db = createTestDatabase();
  const arcId = createArc(db, {
    lengthDays: 30,
    startDay: START,
    wakeTime: '06:30',
    targets: DEFAULT_ORDER_TARGETS,
    oathPath: null,
  });
  return { db, arcId, arc: { id: arcId, startDay: START, lengthDays: 30 } };
}

function logDay(db: ReturnType<typeof createTestDatabase>, day: string, amounts: OrderAmounts) {
  for (const [kind, amount] of Object.entries(amounts))
    saveOrderAmount(db, day, kind as keyof OrderAmounts, amount);
}

function firstOrderId(db: ReturnType<typeof createTestDatabase>, arcId: number): number {
  const row = selectCustomOrders(db, arcId).all()[0];
  if (!row) throw new Error('No own order');
  return row.id;
}

describe('own orders', () => {
  it('adds a tidy order that counts from today', () => {
    const { db, arcId } = setup();
    addCustomOrder(db, arcId, READ, '2026-10-14');
    expect(selectCustomOrders(db, arcId).all()[0]).toMatchObject({
      name: 'Read',
      unit: 'pages',
      firstDay: '2026-10-14',
      lastDay: null,
    });
    expect(getCustomOrdersWithAmounts(db, arcId, '2026-10-13')).toEqual([]);
    expect(getCustomOrdersWithAmounts(db, arcId, '2026-10-14')).toHaveLength(1);
  });

  it('refuses bad drafts and more than the limit', () => {
    const { db, arcId } = setup();
    expect(() => addCustomOrder(db, arcId, { ...READ, name: ' ' }, START)).toThrow(CustomOrderError);
    expect(() => addCustomOrder(db, arcId, { ...READ, full: 5 }, START)).toThrow(CustomOrderError);
    expect(() => addCustomOrder(db, arcId, { ...READ, min: 0.5 }, START)).toThrow(CustomOrderError);
    for (let index = 0; index < CUSTOM_ORDER_LIMITS.maxActive; index += 1) {
      addCustomOrder(db, arcId, READ, START);
    }
    expect(() => addCustomOrder(db, arcId, READ, START)).toThrow(CustomOrderError);
  });

  it('keeps the day open until the own order holds', () => {
    const { db, arcId } = setup();
    addCustomOrder(db, arcId, READ, START);
    const id = firstOrderId(db, arcId);
    logDay(db, START, CONQUERED);
    expect(getDayStanding(db, arcId, START, DEFAULT_ORDER_TARGETS)).toBe('missed');
    saveCustomOrderAmount(db, id, START, 10);
    expect(getDayStanding(db, arcId, START, DEFAULT_ORDER_TARGETS)).toBe('held');
    saveCustomOrderAmount(db, id, START, 30);
    expect(getDayStanding(db, arcId, START, DEFAULT_ORDER_TARGETS)).toBe('conquered');
  });

  it('stands down from tomorrow, but still counts today', () => {
    const { db, arcId } = setup();
    addCustomOrder(db, arcId, READ, START);
    standDownCustomOrder(db, firstOrderId(db, arcId), '2026-10-14');
    expect(getCustomOrdersWithAmounts(db, arcId, '2026-10-14')).toHaveLength(1);
    expect(getCustomOrdersWithAmounts(db, arcId, '2026-10-15')).toEqual([]);
  });

  it('removes an order added and stood down on the same day', () => {
    const { db, arcId } = setup();
    addCustomOrder(db, arcId, READ, START);
    const id = firstOrderId(db, arcId);
    saveCustomOrderAmount(db, id, START, 10);
    standDownCustomOrder(db, id, START);
    expect(selectCustomOrders(db, arcId).all()).toEqual([]);
  });
});

describe('sealing with own orders', () => {
  it('stores each result, so later changes never rewrite history', () => {
    const { db, arcId, arc } = setup();
    addCustomOrder(db, arcId, READ, START);
    const id = firstOrderId(db, arcId);
    logDay(db, START, HELD);
    logDay(db, '2026-10-13', HELD);
    saveCustomOrderAmount(db, id, '2026-10-13', 10);
    sealFinishedDays(db, arc, DEFAULT_ORDER_TARGETS, '2026-10-14');

    // 12th: the own order was not held. 13th: everything held.
    expect(getDayLog(db, START)?.result).toBe('missed');
    expect(getDayLog(db, '2026-10-13')?.result).toBe('held');

    standDownCustomOrder(db, id, '2026-10-14');
    const records = toDayRecords(
      selectDayLogsBetween(db, START, '2026-10-13').all(),
      selectOrderLogsBetween(db, START, '2026-10-13').all(),
      DEFAULT_ORDER_TARGETS,
    );
    expect(records.map((record) => record.result)).toEqual(['missed', 'held']);
  });
});
