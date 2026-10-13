import { type ArcSummaryInput, summarizePastArcs } from '../history';

const arcs: ArcSummaryInput[] = [
  { id: 1, kind: 'campaign', startDay: '2026-09-01', lengthDays: 30, status: 'finished' },
  { id: 2, kind: 'ludus', startDay: '2026-10-05', lengthDays: 3650, status: 'abandoned' },
  { id: 3, kind: 'campaign', startDay: '2026-10-10', lengthDays: 60, status: 'active' },
];

const results = [
  { day: '2026-09-01', result: 'conquered' },
  { day: '2026-09-02', result: 'held' },
  { day: '2026-09-03', result: 'missed' },
  { day: '2026-10-05', result: 'held' },
  { day: '2026-10-09', result: 'conquered' },
  { day: '2026-10-10', result: 'held' },
];

describe('summarizePastArcs', () => {
  it('lists past arcs newest first, each ending where it stopped', () => {
    const past = summarizePastArcs(arcs, results);
    expect(past.map((arc) => arc.id)).toEqual([2, 1]);
    expect(past[0]).toMatchObject({
      kind: 'ludus',
      lengthDays: null,
      endDay: '2026-10-09',
      completedDays: 2,
    });
    expect(past[1]).toMatchObject({ endDay: '2026-09-30', completedDays: 2, conqueredDays: 1 });
  });

  it('cuts a campaign short where the next arc began', () => {
    const past = summarizePastArcs(
      [
        { id: 1, kind: 'campaign', startDay: '2026-09-01', lengthDays: 60, status: 'abandoned' },
        { id: 2, kind: 'ludus', startDay: '2026-09-03', lengthDays: 3650, status: 'active' },
      ],
      results,
    );
    expect(past[0]).toMatchObject({ endDay: '2026-09-02', completedDays: 2 });
  });

  it('is empty with only the active arc', () => {
    expect(summarizePastArcs([arcs[2]!], results)).toEqual([]);
  });
});
