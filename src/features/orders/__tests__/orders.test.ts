import {
  addStep,
  areAllOrdersConquered,
  areAllOrdersHeld,
  clampAmount,
  maxAmountFor,
  ORDER_MAX_AMOUNTS,
  countOrdersHeld,
  DEFAULT_ORDER_TARGETS,
  EMPTY_ORDER_AMOUNTS,
  getOrderStatus,
  removeStep,
} from '..';

const water = DEFAULT_ORDER_TARGETS.water;
const workout = DEFAULT_ORDER_TARGETS.workout;

describe('getOrderStatus', () => {
  it('is none below the minimum, min between, full at or past the goal', () => {
    expect(getOrderStatus(0, water)).toBe('none');
    expect(getOrderStatus(0.5, water)).toBe('none');
    expect(getOrderStatus(1, water)).toBe('min');
    expect(getOrderStatus(3.5, water)).toBe('min');
    expect(getOrderStatus(4, water)).toBe('full');
    expect(getOrderStatus(9, water)).toBe('full');
  });

  it('treats a one-step order (wake-up) as straight to full', () => {
    expect(getOrderStatus(1, DEFAULT_ORDER_TARGETS.wake)).toBe('full');
  });

  it('treats bad numbers as not started', () => {
    expect(getOrderStatus(NaN, water)).toBe('none');
    expect(getOrderStatus(-Infinity, water)).toBe('none');
  });
});

describe('addStep and removeStep', () => {
  it('adds a step and stops at the full goal', () => {
    expect(addStep(0, water)).toBe(1);
    expect(addStep(3, water)).toBe(4);
    expect(addStep(4, water)).toBe(4);
  });

  it('caps a step that would overshoot an adjusted goal', () => {
    expect(addStep(4, { min: 1, full: 4.5, step: 1 })).toBe(4.5);
  });

  it('removes a step and stops at zero', () => {
    expect(removeStep(2, water)).toBe(1);
    expect(removeStep(0, water)).toBe(0);
    expect(removeStep(0.5, water)).toBe(0);
  });

  it('jumps the workout straight to the full goal on one tap', () => {
    expect(addStep(0, workout)).toBe(40);
  });
});

describe('clampAmount', () => {
  it('keeps amounts between 0 and full and removes floating-point noise', () => {
    expect(clampAmount(-3, water)).toBe(0);
    expect(clampAmount(12, water)).toBe(4);
    expect(clampAmount(0.1 + 0.2, water)).toBe(0.3);
    expect(clampAmount(NaN, water)).toBe(0);
  });
});

describe('day totals', () => {
  it('counts orders at least at their minimum', () => {
    expect(countOrdersHeld(EMPTY_ORDER_AMOUNTS, DEFAULT_ORDER_TARGETS)).toBe(0);
    expect(countOrdersHeld({ water: 1, wake: 0, meal: 2, workout: 15 }, DEFAULT_ORDER_TARGETS)).toBe(3);
  });

  it('knows when every order is held, and when every one is conquered', () => {
    const held = { water: 1, wake: 1, meal: 1, workout: 15 };
    expect(areAllOrdersHeld(held, DEFAULT_ORDER_TARGETS)).toBe(true);
    expect(areAllOrdersConquered(held, DEFAULT_ORDER_TARGETS)).toBe(false);

    const conquered = { water: 4, wake: 1, meal: 2, workout: 40 };
    expect(areAllOrdersConquered(conquered, DEFAULT_ORDER_TARGETS)).toBe(true);
  });

  it('is not held when one order is missing', () => {
    expect(areAllOrdersHeld({ water: 4, wake: 1, meal: 2, workout: 0 }, DEFAULT_ORDER_TARGETS)).toBe(false);
  });
});

describe('going past the full goal', () => {
  const water = { min: 1, full: 4, step: 1 };

  it('keeps adding up to the cap when a cap is given', () => {
    expect(addStep(4, water, maxAmountFor('water', water))).toBe(5);
    expect(addStep(ORDER_MAX_AMOUNTS.water, water, maxAmountFor('water', water))).toBe(
      ORDER_MAX_AMOUNTS.water,
    );
    expect(clampAmount(90, water, maxAmountFor('water', water))).toBe(ORDER_MAX_AMOUNTS.water);
  });

  it('never caps below a full goal tuned above the cap', () => {
    const bigMeals = { min: 1, full: 9, step: 1 };
    expect(maxAmountFor('meal', bigMeals)).toBe(9);
    expect(clampAmount(9, bigMeals, 2)).toBe(9);
  });
});
