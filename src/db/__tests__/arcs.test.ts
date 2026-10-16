import { FEATURES } from '@/config/features';
import { buildOrderTargets, DEFAULT_ORDER_TARGETS } from '@/features/orders';

import {
  addArcOrder,
  createArc,
  getActiveArc,
  removeArcOrder,
  selectAllArcs,
  selectArcOrders,
  setArcOrderFull,
  setArcWakeTime,
  startNextArc,
  toOrderTargets,
} from '../arcs';
import { addCustomOrder, saveCustomOrderAmount, selectCustomOrdersOn } from '../customOrders';
import { getTruceReserve } from '../truces';
import type { ArcOrderRow } from '../schema';
import { createTestDatabase } from '../testing/testDatabase';

const NEW_ARC = {
  lengthDays: 60,
  startDay: '2026-10-09',
  wakeTime: '06:30',
  targets: buildOrderTargets({ water: 3.5, meal: 2, workout: 45 }),
  oathPath: null,
};

describe('arcs', () => {
  it('has no active arc before onboarding', () => {
    expect(getActiveArc(createTestDatabase())).toBeUndefined();
  });

  it('creates the arc and its four orders together', () => {
    const db = createTestDatabase();
    const id = createArc(db, NEW_ARC);
    const arc = getActiveArc(db);
    expect(arc).toMatchObject({
      id,
      lengthDays: 60,
      startDay: '2026-10-09',
      wakeTime: '06:30',
      status: 'active',
    });
    const targets = toOrderTargets(selectArcOrders(db, id).all());
    expect(targets.water?.full).toBe(3.5);
    expect(targets.workout).toEqual({ min: 15, full: 45, step: 45 });
  });

  it('changes the wake-up time, refusing a malformed one', () => {
    const db = createTestDatabase();
    const id = createArc(db, NEW_ARC);
    setArcWakeTime(db, id, '05:45');
    expect(getActiveArc(db)?.wakeTime).toBe('05:45');
    expect(() => setArcWakeTime(db, id, '25:00')).toThrow();
    expect(() => setArcWakeTime(db, id, '6:5')).toThrow();
    expect(getActiveArc(db)?.wakeTime).toBe('05:45');
  });

  it('keeps only one active arc', () => {
    const db = createTestDatabase();
    const first = createArc(db, NEW_ARC);
    const second = createArc(db, { ...NEW_ARC, lengthDays: 30 });
    expect(getActiveArc(db)?.id).toBe(second);
    expect(second).not.toBe(first);
  });
});

describe('toOrderTargets', () => {
  it('falls back to defaults for missing, unknown or broken rows', () => {
    const rows = [
      { arcId: 1, kind: 'water', min: 1, full: 3, step: 1 },
      { arcId: 1, kind: 'meal', min: 1, full: 0, step: 1 },
      { arcId: 1, kind: 'sleep', min: 1, full: 8, step: 1 },
      { arcId: 1, kind: 'workout', min: NaN, full: 40, step: 40 },
    ] as ArcOrderRow[];
    const targets = toOrderTargets(rows);
    expect(targets.water?.full).toBe(3);
    expect(targets.meal).toEqual(DEFAULT_ORDER_TARGETS.meal);
    expect(targets.workout).toEqual(DEFAULT_ORDER_TARGETS.workout);
    expect(targets.wake).toEqual(DEFAULT_ORDER_TARGETS.wake);
  });

  it('starts the Ludus with no end and no Truce', () => {
    const db = createTestDatabase();
    createArc(db, { ...NEW_ARC, kind: 'ludus' });
    expect(getActiveArc(db)).toMatchObject({ kind: 'ludus', lengthDays: 3650 });
    expect(getTruceReserve(db)).toBe(0);
  });

  it('moves on to a new arc, carrying the setup and own orders over', () => {
    jest.replaceProperty(FEATURES, 'customOrders', true);
    const db = createTestDatabase();
    const first = createArc(db, { ...NEW_ARC, kind: 'ludus' });
    const ownId = addCustomOrder(db, first, { name: 'Read', unit: 'pages', min: 10, full: 30 }, '2026-10-09');
    saveCustomOrderAmount(db, ownId, '2026-10-12', 10);
    const next = startNextArc(db, { kind: 'campaign', lengthDays: 30, startDay: '2026-10-12' });

    expect(getActiveArc(db)).toMatchObject({ id: next, kind: 'campaign', lengthDays: 30, wakeTime: '06:30' });
    expect(toOrderTargets(selectArcOrders(db, next).all()).water?.full).toBe(3.5);
    expect(getTruceReserve(db)).toBe(1);
    const own = selectCustomOrdersOn(db, next, '2026-10-12').all();
    expect(own.map((order) => order.name)).toEqual(['Read']);
    const arcs = selectAllArcs(db).all();
    expect(arcs.map((arc) => arc.status)).toEqual(['active', 'abandoned']);
  });

  it('marks a campaign finished when it is past its last day', () => {
    const db = createTestDatabase();
    createArc(db, { ...NEW_ARC, lengthDays: 30 });
    startNextArc(db, { kind: 'ludus', lengthDays: 0, startDay: '2026-11-08' });
    expect(selectAllArcs(db).all()[1]?.status).toBe('finished');
  });

  it('gives free training only the orders picked, and lets them change', () => {
    const db = createTestDatabase();
    const id = createArc(db, { ...NEW_ARC, kind: 'ludus', targets: { water: DEFAULT_ORDER_TARGETS.water } });
    expect(toOrderTargets(selectArcOrders(db, id).all(), 'ludus')).toEqual({
      water: DEFAULT_ORDER_TARGETS.water,
    });

    addArcOrder(db, id, 'workout');
    addArcOrder(db, id, 'workout');
    removeArcOrder(db, id, 'water');
    expect(toOrderTargets(selectArcOrders(db, id).all(), 'ludus')).toEqual({
      workout: DEFAULT_ORDER_TARGETS.workout,
    });
  });

  it('starts free training with no orders at all, and a campaign from it gets all four', () => {
    const db = createTestDatabase();
    const id = createArc(db, { ...NEW_ARC, kind: 'ludus', targets: {} });
    expect(selectArcOrders(db, id).all()).toEqual([]);
    const next = startNextArc(db, { kind: 'campaign', lengthDays: 30, startDay: '2026-10-12' });
    expect(Object.keys(toOrderTargets(selectArcOrders(db, next).all(), 'campaign')).sort()).toEqual([
      'meal',
      'wake',
      'water',
      'workout',
    ]);
  });

  it("keeps a campaign's four orders fixed", () => {
    const db = createTestDatabase();
    const id = createArc(db, NEW_ARC);
    expect(() => removeArcOrder(db, id, 'water')).toThrow();
    expect(selectArcOrders(db, id).all()).toHaveLength(4);
  });
});

describe("changing Vinco's goals", () => {
  it('fits a new full goal to its range and keeps the minimum', () => {
    const db = createTestDatabase();
    const id = createArc(db, NEW_ARC);
    setArcOrderFull(db, id, 'water', 4.3);
    setArcOrderFull(db, id, 'meal', 9);
    setArcOrderFull(db, id, 'workout', 60);
    const targets = toOrderTargets(selectArcOrders(db, id).all());
    expect(targets.water).toEqual({ ...DEFAULT_ORDER_TARGETS.water, full: 4.5 });
    expect(targets.meal?.full).toBe(3);
    // A workout's step is its goal: one log of the full session conquers it.
    expect(targets.workout).toMatchObject({ min: DEFAULT_ORDER_TARGETS.workout.min, full: 60, step: 60 });
  });

  it('does nothing for an order free training does not have', () => {
    const db = createTestDatabase();
    const id = createArc(db, { ...NEW_ARC, kind: 'ludus', targets: { water: DEFAULT_ORDER_TARGETS.water } });
    setArcOrderFull(db, id, 'meal', 2);
    expect(Object.keys(toOrderTargets(selectArcOrders(db, id).all(), 'ludus'))).toEqual(['water']);
  });
});
