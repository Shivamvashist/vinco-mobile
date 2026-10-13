import {
  clampCustomAmount,
  CUSTOM_ORDER_LIMITS,
  getCustomOrderStatus,
  isCustomOrderActiveOn,
  isTapCounted,
  nextCustomAmount,
  normalizeCustomOrder,
  previousCustomAmount,
  toCustomOrderDraft,
  validateCustomOrder,
} from '..';

const READ = { name: 'Read', unit: 'pages', min: 10, full: 30 };

describe('own orders', () => {
  it('is active from its first day to its last', () => {
    const order = { firstDay: '2026-10-12', lastDay: '2026-10-14' };
    expect(isCustomOrderActiveOn(order, '2026-10-11')).toBe(false);
    expect(isCustomOrderActiveOn(order, '2026-10-14')).toBe(true);
    expect(isCustomOrderActiveOn(order, '2026-10-15')).toBe(false);
    expect(isCustomOrderActiveOn({ firstDay: '2026-10-12', lastDay: null }, '2030-01-01')).toBe(true);
  });

  it('validates drafts', () => {
    expect(validateCustomOrder(READ, 0)).toBeNull();
    expect(validateCustomOrder({ ...READ, min: 1, full: 1 }, 0)).toBeNull();
    expect(validateCustomOrder({ ...READ, name: '  ' }, 0)).toBe('nameMissing');
    expect(validateCustomOrder({ ...READ, full: 5 }, 0)).toBe('fullBelowMin');
    expect(validateCustomOrder({ ...READ, min: 0 }, 0)).toBe('goalInvalid');
    expect(validateCustomOrder({ ...READ, full: Number.NaN }, 0)).toBe('goalInvalid');
    expect(validateCustomOrder({ ...READ, full: CUSTOM_ORDER_LIMITS.maxGoal + 1 }, 0)).toBe('goalInvalid');
    expect(validateCustomOrder(READ, CUSTOM_ORDER_LIMITS.maxActive)).toBe('tooMany');
  });

  it('tidies names and units', () => {
    expect(normalizeCustomOrder({ ...READ, name: '  Read   a  book ', unit: ' pages ' })).toMatchObject({
      name: 'Read a book',
      unit: 'pages',
    });
  });

  it('counts up one per tap, to the goal, and back down', () => {
    const water = toCustomOrderDraft('Water', 'glass', 12);
    expect(water).toEqual({ name: 'Water', unit: 'glass', min: 12, full: 12 });
    expect(nextCustomAmount(0, water)).toBe(1);
    expect(nextCustomAmount(11, water)).toBe(12);
    expect(nextCustomAmount(12, water)).toBe(12);
    expect(getCustomOrderStatus(11, water)).toBe('none');
    expect(getCustomOrderStatus(12, water)).toBe('full');
    expect(previousCustomAmount(1, water)).toBe(0);
    expect(previousCustomAmount(0, water)).toBe(0);
  });

  it('keeps a lower minimum from older orders working', () => {
    expect(getCustomOrderStatus(10, READ)).toBe('min');
    expect(nextCustomAmount(29, READ)).toBe(30);
  });

  it('taps small counts and types big ones', () => {
    expect(isTapCounted({ full: CUSTOM_ORDER_LIMITS.maxTapCount })).toBe(true);
    expect(isTapCounted({ full: 10000 })).toBe(false);
    expect(clampCustomAmount(12.6, { full: 30 })).toBe(13);
    expect(clampCustomAmount(-4, { full: 30 })).toBe(0);
    expect(clampCustomAmount(99, { full: 30 })).toBe(30);
    expect(clampCustomAmount(Number.NaN, { full: 30 })).toBe(0);
  });
});
