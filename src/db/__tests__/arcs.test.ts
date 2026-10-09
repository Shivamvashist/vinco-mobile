import { buildOrderTargets, DEFAULT_ORDER_TARGETS } from '@/features/orders';

import { createArc, getActiveArc, selectArcOrders, toOrderTargets } from '../arcs';
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
    expect(targets.water.full).toBe(3.5);
    expect(targets.workout).toEqual({ min: 15, full: 45, step: 45 });
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
    expect(targets.water.full).toBe(3);
    expect(targets.meal).toEqual(DEFAULT_ORDER_TARGETS.meal);
    expect(targets.workout).toEqual(DEFAULT_ORDER_TARGETS.workout);
    expect(targets.wake).toEqual(DEFAULT_ORDER_TARGETS.wake);
  });
});
