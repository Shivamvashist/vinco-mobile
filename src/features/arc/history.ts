import { addDays, type DayKey, daysBetween } from '@/lib/dates';

import { type ArcKind, arcEndDay } from './arc';

export type ArcSummaryInput = {
  id: number;
  kind: ArcKind;
  startDay: DayKey;
  lengthDays: number;
  status: 'active' | 'finished' | 'abandoned';
};

export type PastArc = {
  id: number;
  kind: ArcKind;
  /** Campaign length (null for the Ludus). */
  lengthDays: number | null;
  status: 'finished' | 'abandoned';
  startDay: DayKey;
  /** The last day it ran: its own last day, or the day before the next arc began. */
  endDay: DayKey;
  /** Days held or conquered. */
  completedDays: number;
  conqueredDays: number;
};

/**
 * Every arc before the current one, newest first, with what was done in it. Days are kept by
 * date, so an arc's days are the stored results between its start and where it stopped.
 * @param arcs every arc, any order
 * @param results each sealed day's stored result
 */
export function summarizePastArcs(
  arcs: readonly ArcSummaryInput[],
  results: readonly { day: DayKey; result: string | null }[],
): PastArc[] {
  const byStart = [...arcs].sort((a, b) =>
    a.startDay === b.startDay ? a.id - b.id : a.startDay < b.startDay ? -1 : 1,
  );
  return byStart
    .map((arc, index): PastArc | null => {
      if (arc.status === 'active') return null;
      const next = byStart[index + 1];
      const ownEnd = arc.kind === 'ludus' ? null : arcEndDay(arc.startDay, arc.lengthDays);
      const beforeNext = next ? addDays(next.startDay, -1) : null;
      const endDay =
        ownEnd && beforeNext
          ? daysBetween(ownEnd, beforeNext) < 0
            ? beforeNext
            : ownEnd
          : (ownEnd ?? beforeNext ?? arc.startDay);
      const inside = results.filter((row) => row.day >= arc.startDay && row.day <= endDay);
      return {
        id: arc.id,
        kind: arc.kind,
        lengthDays: arc.kind === 'ludus' ? null : arc.lengthDays,
        status: arc.status,
        startDay: arc.startDay,
        // An arc that ended before it began (switched on its first day) still shows one day.
        endDay: daysBetween(arc.startDay, endDay) < 0 ? arc.startDay : endDay,
        completedDays: inside.filter((row) => row.result === 'held' || row.result === 'conquered').length,
        conqueredDays: inside.filter((row) => row.result === 'conquered').length,
      };
    })
    .filter((arc): arc is PastArc => arc !== null)
    .reverse();
}
