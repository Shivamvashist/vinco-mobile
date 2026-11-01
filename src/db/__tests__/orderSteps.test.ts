import { buildOrderTargets } from '@/features/orders';

import { createArc } from '../arcs';
import { addCustomOrder, saveCustomOrderAmount } from '../customOrders';
import { getDayLog, updateDayLog } from '../dayLogs';
import { saveOrderAmount } from '../orderLogs';
import { ownOrderStepKey, selectOrderStepsForDay } from '../orderSteps';
import { clearJourney } from '../reset';
import { createTestDatabase } from '../testing/testDatabase';

const DAY = '2026-11-01';
const EARLY = new Date('2026-11-01T07:00:00.000Z');
const LATER = new Date('2026-11-01T09:30:00.000Z');

describe('order steps', () => {
  it('records one step per rise, with the amount reached and when', () => {
    const db = createTestDatabase();
    saveOrderAmount(db, DAY, 'water', 0.5, { now: EARLY });
    saveOrderAmount(db, DAY, 'water', 1, { now: LATER });
    const steps = selectOrderStepsForDay(db, DAY).all();
    expect(steps.map((step) => [step.orderKey, step.amount, step.at])).toEqual([
      ['water', 0.5, EARLY.toISOString()],
      ['water', 1, LATER.toISOString()],
    ]);
  });

  it('takes back the steps an undo removes, and records nothing for no change', () => {
    const db = createTestDatabase();
    saveOrderAmount(db, DAY, 'water', 0.5, { now: EARLY });
    saveOrderAmount(db, DAY, 'water', 1, { now: LATER });
    saveOrderAmount(db, DAY, 'water', 0.5, { now: LATER });
    saveOrderAmount(db, DAY, 'water', 0.5, { now: LATER });
    expect(
      selectOrderStepsForDay(db, DAY)
        .all()
        .map((step) => step.amount),
    ).toEqual([0.5]);
  });

  it('records own orders under their own key, and drops them with the order', () => {
    const db = createTestDatabase();
    const arcId = createArc(db, {
      lengthDays: 30,
      startDay: DAY,
      wakeTime: '06:30',
      targets: buildOrderTargets({}),
      oathPath: null,
    });
    const orderId = addCustomOrder(db, arcId, { name: 'Read', unit: 'pages', min: 10, full: 10 }, DAY);
    saveCustomOrderAmount(db, orderId, DAY, 3, EARLY);
    expect(
      selectOrderStepsForDay(db, DAY)
        .all()
        .map((step) => step.orderKey),
    ).toEqual([ownOrderStepKey(orderId)]);
    clearJourney(db);
    expect(selectOrderStepsForDay(db, DAY).all()).toEqual([]);
  });
});

describe('proof times on the day log', () => {
  it('stamps when the selfie, weight and calories were logged, and clears them with the value', () => {
    const db = createTestDatabase();
    updateDayLog(db, DAY, { selfiePath: 'selfie.jpg', weightKg: 80 }, EARLY);
    updateDayLog(db, DAY, { calories: 2100 }, LATER);
    expect(getDayLog(db, DAY)).toMatchObject({
      selfieAt: EARLY.toISOString(),
      weightAt: EARLY.toISOString(),
      caloriesAt: LATER.toISOString(),
    });
    updateDayLog(db, DAY, { weightKg: null }, LATER);
    expect(getDayLog(db, DAY)).toMatchObject({
      weightKg: null,
      weightAt: null,
      selfieAt: EARLY.toISOString(),
    });
  });

  it('leaves the times alone when other fields change', () => {
    const db = createTestDatabase();
    updateDayLog(db, DAY, { selfiePath: 'selfie.jpg' }, EARLY);
    updateDayLog(db, DAY, { sealedAt: LATER.toISOString() }, LATER);
    expect(getDayLog(db, DAY)?.selfieAt).toBe(EARLY.toISOString());
  });
});
