import { type DayRecord, earnsTruce, findTruceableDays, getTruceOffer, planTrucePayment, TRUCES } from '..';

/** Records for consecutive days starting on a date. */
function run(start: string, results: DayRecord['result'][]): DayRecord[] {
  const [year, month, day] = start.split('-').map(Number) as [number, number, number];
  return results.map((result, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index));
    return { day: date.toISOString().slice(0, 10), result };
  });
}

describe('planTrucePayment', () => {
  it('uses the reserve first, then denarii', () => {
    expect(planTrucePayment(1, 2, 0)).toEqual({ fromReserve: 1, toBuy: 0, cost: 0, canAfford: true });
    expect(planTrucePayment(2, 1, 100)).toEqual({
      fromReserve: 1,
      toBuy: 1,
      cost: TRUCES.priceDenarii,
      canAfford: true,
    });
  });

  it('refuses when the denarii fall short', () => {
    expect(planTrucePayment(1, 0, TRUCES.priceDenarii - 1).canAfford).toBe(false);
    expect(planTrucePayment(1, 0, TRUCES.priceDenarii).canAfford).toBe(true);
  });

  it('treats broken numbers safely', () => {
    expect(planTrucePayment(0, 3, 500).canAfford).toBe(false);
    expect(planTrucePayment(-2, -1, -50)).toEqual({ fromReserve: 0, toBuy: 0, cost: 0, canAfford: false });
    expect(planTrucePayment(1.7, 0.5, 100)).toEqual({
      fromReserve: 0,
      toBuy: 1,
      cost: TRUCES.priceDenarii,
      canAfford: true,
    });
  });
});

describe('findTruceableDays', () => {
  it('returns the run of misses that ends yesterday, oldest first', () => {
    const records = run('2026-10-10', ['held', 'missed', 'missed']);
    expect(findTruceableDays(records, '2026-10-13')).toEqual(['2026-10-11', '2026-10-12']);
  });

  it('is empty when yesterday was not missed or the window has passed', () => {
    expect(findTruceableDays(run('2026-10-10', ['missed', 'held']), '2026-10-12')).toEqual([]);
    expect(findTruceableDays(run('2026-10-10', ['held', 'missed']), '2026-10-13')).toEqual([]);
    expect(findTruceableDays(run('2026-10-10', ['truce']), '2026-10-11')).toEqual([]);
    expect(findTruceableDays([], '2026-10-11')).toEqual([]);
  });
});

describe('getTruceOffer', () => {
  it('offers to save the campaign that came before the misses', () => {
    const records = run('2026-10-10', ['held', 'conquered', 'truce', 'held', 'missed']);
    expect(getTruceOffer(records, '2026-10-15', 1, 0)).toEqual({
      days: ['2026-10-14'],
      campaignSaved: 4,
      fromReserve: 1,
      toBuy: 0,
      cost: 0,
      canAfford: true,
    });
  });

  it('prices one Truce per missed day', () => {
    const records = run('2026-10-10', ['held', 'missed', 'missed']);
    const offer = getTruceOffer(records, '2026-10-13', 0, 60);
    expect(offer?.toBuy).toBe(2);
    expect(offer?.canAfford).toBe(false);
  });

  it('offers nothing when there is no campaign to save', () => {
    expect(getTruceOffer(run('2026-10-10', ['missed']), '2026-10-11', 3, 0)).toBeNull();
    expect(getTruceOffer(run('2026-10-10', ['held']), '2026-10-11', 3, 0)).toBeNull();
  });
});

describe('earnsTruce', () => {
  it('earns one every full week of campaign', () => {
    expect(earnsTruce(7)).toBe(true);
    expect(earnsTruce(14)).toBe(true);
    expect(earnsTruce(6)).toBe(false);
    expect(earnsTruce(0)).toBe(false);
  });
});
