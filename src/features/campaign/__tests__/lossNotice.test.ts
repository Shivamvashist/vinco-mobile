import { type DayRecord, findLossToNotify, type LossNoticeArc, shouldLeaveLossScreen } from '..';

/** Records for consecutive days starting on a date. */
function run(start: string, results: DayRecord['result'][]): DayRecord[] {
  const [year, month, day] = start.split('-').map(Number) as [number, number, number];
  return results.map((result, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index));
    return { day: date.toISOString().slice(0, 10), result };
  });
}

const campaignArc: LossNoticeArc = { id: 2, kind: 'campaign', startDay: '2026-10-10' };
const broken = run('2026-10-10', ['held', 'held', 'missed', 'missed', 'held']);

describe('findLossToNotify', () => {
  it('names a new break by its first missed day', () => {
    expect(
      findLossToNotify({ arc: campaignArc, isLoaded: true, records: broken, acknowledgedLossDay: null }),
    ).toBe('2026-10-12');
  });

  it('waits until the arc and its records are loaded', () => {
    expect(
      findLossToNotify({ arc: campaignArc, isLoaded: false, records: broken, acknowledgedLossDay: null }),
    ).toBeNull();
  });

  it('never shows a loss without an arc (just after a reset) or in free training', () => {
    expect(
      findLossToNotify({ arc: null, isLoaded: true, records: broken, acknowledgedLossDay: null }),
    ).toBeNull();
    expect(
      findLossToNotify({
        arc: { ...campaignArc, kind: 'ludus' },
        isLoaded: true,
        records: broken,
        acknowledgedLossDay: null,
      }),
    ).toBeNull();
  });

  it('ignores breaks from before the arc started (an old journey still in the live query)', () => {
    const newArc: LossNoticeArc = { id: 3, kind: 'campaign', startDay: '2026-10-20' };
    expect(
      findLossToNotify({ arc: newArc, isLoaded: true, records: broken, acknowledgedLossDay: null }),
    ).toBeNull();
    const later = [...broken, ...run('2026-10-20', ['held', 'missed'])];
    expect(findLossToNotify({ arc: newArc, isLoaded: true, records: later, acknowledgedLossDay: null })).toBe(
      '2026-10-21',
    );
  });

  it('shows each break once, and never an older one uncovered by a Truce', () => {
    expect(
      findLossToNotify({
        arc: campaignArc,
        isLoaded: true,
        records: broken,
        acknowledgedLossDay: '2026-10-12',
      }),
    ).toBeNull();
    expect(
      findLossToNotify({
        arc: campaignArc,
        isLoaded: true,
        records: broken,
        acknowledgedLossDay: '2026-10-13',
      }),
    ).toBeNull();
    expect(
      findLossToNotify({
        arc: campaignArc,
        isLoaded: true,
        records: broken,
        acknowledgedLossDay: '2026-10-01',
      }),
    ).toBe('2026-10-12');
  });

  it('finds nothing in a clean campaign or an empty first day', () => {
    const clean = run('2026-10-10', ['held', 'conquered', 'truce']);
    expect(
      findLossToNotify({ arc: campaignArc, isLoaded: true, records: clean, acknowledgedLossDay: null }),
    ).toBeNull();
    expect(
      findLossToNotify({ arc: campaignArc, isLoaded: true, records: [], acknowledgedLossDay: null }),
    ).toBeNull();
  });
});

describe('shouldLeaveLossScreen', () => {
  it('stays while loading', () => {
    expect(shouldLeaveLossScreen({ isLoaded: false, arc: null, records: [], hasOffer: false })).toBe(false);
  });

  it('leaves without a campaign arc', () => {
    expect(shouldLeaveLossScreen({ isLoaded: true, arc: null, records: broken, hasOffer: false })).toBe(true);
    expect(
      shouldLeaveLossScreen({
        isLoaded: true,
        arc: { ...campaignArc, kind: 'ludus' },
        records: broken,
        hasOffer: false,
      }),
    ).toBe(true);
  });

  it('leaves when there is neither a break nor a Truce offer', () => {
    const clean = run('2026-10-10', ['held', 'held']);
    expect(shouldLeaveLossScreen({ isLoaded: true, arc: campaignArc, records: clean, hasOffer: false })).toBe(
      true,
    );
  });

  it('stays with a break of this arc, or with a Truce to call', () => {
    expect(
      shouldLeaveLossScreen({ isLoaded: true, arc: campaignArc, records: broken, hasOffer: false }),
    ).toBe(false);
    expect(shouldLeaveLossScreen({ isLoaded: true, arc: campaignArc, records: [], hasOffer: true })).toBe(
      false,
    );
  });
});
