import { DEFAULT_ORDER_TARGETS } from '@/features/orders';

import {
  countCompletedDays,
  type DayRecord,
  findLatestLoss,
  findResurgoDays,
  getBestCampaign,
  getCurrentCampaign,
  getDayAwards,
  getDayResult,
  getRankStatus,
} from '..';

const held = { water: 1, wake: 1, meal: 1, workout: 15 };
const conquered = { water: 4, wake: 1, meal: 2, workout: 40 };
const partial = { water: 4, wake: 1, meal: 2, workout: 0 };

/** Records for consecutive days starting on a date. */
function run(start: string, results: DayRecord['result'][]): DayRecord[] {
  const [year, month, day] = start.split('-').map(Number) as [number, number, number];
  return results.map((result, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index));
    return { day: date.toISOString().slice(0, 10), result };
  });
}

describe('getDayResult', () => {
  it('ranks conquered above held, and protects only missed days with a Truce', () => {
    expect(getDayResult(conquered, DEFAULT_ORDER_TARGETS, false)).toBe('conquered');
    expect(getDayResult(held, DEFAULT_ORDER_TARGETS, false)).toBe('held');
    expect(getDayResult(partial, DEFAULT_ORDER_TARGETS, false)).toBe('missed');
    expect(getDayResult(partial, DEFAULT_ORDER_TARGETS, true)).toBe('truce');
    expect(getDayResult(held, DEFAULT_ORDER_TARGETS, true)).toBe('held');
  });
});

describe('campaigns', () => {
  const today = '2026-10-17';

  it('counts back from yesterday, adding today once held', () => {
    const records = run('2026-10-10', ['held', 'held', 'conquered', 'truce', 'held', 'held', 'held']);
    expect(getCurrentCampaign(records, today, false)).toBe(7);
    expect(getCurrentCampaign(records, today, true)).toBe(8);
  });

  it('stops at a missed day or a gap', () => {
    expect(getCurrentCampaign(run('2026-10-13', ['held', 'missed', 'held', 'held']), today, false)).toBe(2);
    expect(getCurrentCampaign(run('2026-10-10', ['held', 'held']), today, false)).toBe(0);
  });

  it('is zero on Day I before today is held', () => {
    expect(getCurrentCampaign([], today, false)).toBe(0);
    expect(getCurrentCampaign([], today, true)).toBe(1);
  });

  it('remembers the best campaign, including the current one', () => {
    const records = run('2026-10-01', ['held', 'held', 'held', 'held', 'missed', 'held', 'held']);
    expect(getBestCampaign(records, '2026-10-08', false)).toBe(4);
    expect(getBestCampaign(records, '2026-10-08', true)).toBe(4);
    const longer = run('2026-10-01', ['held', 'missed', 'held', 'held', 'held']);
    expect(getBestCampaign(longer, '2026-10-06', true)).toBe(4);
  });

  it('counts completed days without Truces', () => {
    const records = run('2026-10-10', ['held', 'truce', 'conquered', 'missed']);
    expect(countCompletedDays(records, false)).toBe(2);
    expect(countCompletedDays(records, true)).toBe(3);
  });

  it('finds Resurgo: held the day after a miss', () => {
    const records = run('2026-10-10', ['held', 'missed', 'held', 'missed', 'missed', 'held']);
    expect(findResurgoDays(records)).toEqual(['2026-10-12', '2026-10-15']);
  });
});

describe('getRankStatus', () => {
  it('has no rank before the first completed day', () => {
    expect(getRankStatus(0, false)).toMatchObject({ current: null, daysToNext: 1 });
  });

  it('promotes exactly at each threshold', () => {
    expect(getRankStatus(1, false).current?.name).toBe('Tiro');
    expect(getRankStatus(3, false).current?.name).toBe('Tiro');
    expect(getRankStatus(4, false).current?.name).toBe('Miles');
    expect(getRankStatus(12, false)).toMatchObject({ current: { name: 'Optio' }, daysToNext: 8 });
  });

  it('stops at Consul by days, and makes Caesar only for a finished 90-day arc', () => {
    expect(getRankStatus(200, false)).toMatchObject({ current: { name: 'Consul' }, next: null, progress: 1 });
    expect(getRankStatus(90, true).current?.name).toBe('Caesar');
  });

  it('handles bad input', () => {
    expect(getRankStatus(NaN, false).current).toBeNull();
    expect(getRankStatus(-5, false).current).toBeNull();
  });
});

describe('getDayAwards', () => {
  it('pays 5 for held, 10 for conquered, nothing for a Truce or a miss', () => {
    expect(getDayAwards('2026-10-17', 'held', 3)).toEqual([
      { day: '2026-10-17', reason: 'day_held', amount: 5 },
    ]);
    expect(getDayAwards('2026-10-17', 'conquered', 3)[0]?.amount).toBe(10);
    expect(getDayAwards('2026-10-17', 'truce', 3)).toEqual([]);
    expect(getDayAwards('2026-10-17', 'missed', 0)).toEqual([]);
  });

  it('adds 25 for every 7 days of campaign', () => {
    const awards = getDayAwards('2026-10-17', 'held', 14);
    expect(awards.map((award) => award.reason)).toEqual(['day_held', 'campaign_week']);
    expect(getDayAwards('2026-10-17', 'truce', 7).map((award) => award.amount)).toEqual([25]);
  });
});

describe('findLatestLoss', () => {
  it('is null when nothing was missed', () => {
    expect(findLatestLoss(run('2026-10-10', ['held', 'truce', 'conquered']))).toBeNull();
  });

  it('finds the latest break and the campaign it ended', () => {
    const records = run('2026-10-10', ['held', 'missed', 'held', 'truce', 'held', 'missed']);
    expect(findLatestLoss(records)).toEqual({
      day: '2026-10-15',
      firstMissedDay: '2026-10-15',
      campaignBefore: 3,
    });
  });

  it('measures the campaign from the start of a run of misses', () => {
    expect(findLatestLoss(run('2026-10-10', ['held', 'held', 'missed', 'missed']))).toEqual({
      day: '2026-10-13',
      firstMissedDay: '2026-10-12',
      campaignBefore: 2,
    });
  });

  it('reports a zero campaign when nothing came before the misses', () => {
    expect(findLatestLoss(run('2026-10-10', ['missed', 'missed']))).toEqual({
      day: '2026-10-11',
      firstMissedDay: '2026-10-10',
      campaignBefore: 0,
    });
  });
});
