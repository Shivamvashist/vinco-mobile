import { periodOf } from '@/features/periods';

import { gloriaParts, gloriaPeriod } from '..';

describe('Gloria by period', () => {
  const byDay = new Map([
    ['2026-10-26', 80],
    ['2026-10-31', 35],
    ['2026-11-01', 10],
    ['2026-09-15', 200],
  ]);

  it('gives a week its bars and total', () => {
    expect(gloriaPeriod(byDay, periodOf('week', '2026-11-01'))).toEqual({
      bars: [80, 0, 0, 0, 0, 35, 10],
      total: 125,
    });
  });

  it('gives a year a bar a month', () => {
    const year = gloriaPeriod(byDay, periodOf('year', '2026-11-01'));
    expect(year.bars).toHaveLength(12);
    expect(year.bars.slice(8, 11)).toEqual([200, 115, 10]);
    expect(year.total).toBe(325);
  });

  it('reads 0 before the journey', () => {
    expect(gloriaPeriod(byDay, periodOf('month', '2025-01-01')).total).toBe(0);
  });
});

describe('gloriaParts', () => {
  it('lists sources that gave something, in order', () => {
    expect(gloriaParts({ orders: 40, conquered: 20, todos: 0, focus: 25, claims: 0, total: 85 })).toEqual([
      { source: 'orders', value: 40 },
      { source: 'conquered', value: 20 },
      { source: 'focus', value: 25 },
    ]);
    expect(gloriaParts({ orders: 0, conquered: 0, todos: 0, focus: 0, claims: 0, total: 0 })).toEqual([]);
  });
});
