import {
  CUSTOM_ORDER_LIMITS,
  getCustomOrderStatus,
  isCustomOrderActiveOn,
  nextCustomAmount,
  normalizeCustomOrder,
  previousCustomAmount,
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

  it('steps up and down a level per tap', () => {
    expect(getCustomOrderStatus(0, READ)).toBe('none');
    expect(nextCustomAmount(0, READ)).toBe(10);
    expect(nextCustomAmount(10, READ)).toBe(30);
    expect(nextCustomAmount(30, READ)).toBe(30);
    expect(previousCustomAmount(30, READ)).toBe(10);
    expect(previousCustomAmount(10, READ)).toBe(0);
    expect(previousCustomAmount(0, READ)).toBe(0);
  });

  it('treats a yes-or-no order as one step', () => {
    const noSugar = { min: 1, full: 1 };
    expect(nextCustomAmount(0, noSugar)).toBe(1);
    expect(getCustomOrderStatus(1, noSugar)).toBe('full');
    expect(previousCustomAmount(1, noSugar)).toBe(0);
  });
});
