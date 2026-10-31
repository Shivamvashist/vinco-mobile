import type { DayKey } from '@/lib/dates';

import { type DayRecord, findLatestLoss } from './campaign';

/** The parts of the active arc the loss notice looks at. */
export type LossNoticeArc = { id: number; kind: 'campaign' | 'ludus'; startDay: DayKey };

export type LossNoticeInput = {
  /** The active arc, or null when there is none (before onboarding, or just after a reset). */
  arc: LossNoticeArc | null;
  /** True once the arc and its records have been read at least once. */
  isLoaded: boolean;
  /** Sealed days of the arc, any order. */
  records: readonly DayRecord[];
  /** The first missed day of the last break already shown, or null. */
  acknowledgedLossDay: DayKey | null;
};

/**
 * The break to show on the campaign-lost screen, named by its first missed day, or null.
 * Only a loaded campaign arc can lose its campaign (free training has none), only a break
 * on or after the arc's start belongs to it (rows from an old journey never count), and only
 * a break later than the last one shown is new. Day keys sort as text.
 */
export function findLossToNotify({
  arc,
  isLoaded,
  records,
  acknowledgedLossDay,
}: LossNoticeInput): DayKey | null {
  if (!isLoaded || arc?.kind !== 'campaign') return null;
  const breakDay = findLatestLoss(records.filter((record) => record.day >= arc.startDay))?.firstMissedDay;
  if (breakDay == null || breakDay < arc.startDay) return null;
  if (acknowledgedLossDay != null && breakDay <= acknowledgedLossDay) return null;
  return breakDay;
}

/**
 * True when the campaign-lost screen has nothing to show and should leave: once loaded, with
 * no campaign arc, or with neither a break nor a Truce offer. Only while the screen still shows
 * the loss: after "Rise again" or a Truce it stays until the user taps through.
 */
export function shouldLeaveLossScreen(input: {
  isLoaded: boolean;
  arc: Pick<LossNoticeArc, 'kind' | 'startDay'> | null;
  records: readonly DayRecord[];
  hasOffer: boolean;
}): boolean {
  if (!input.isLoaded) return false;
  const { arc } = input;
  if (arc?.kind !== 'campaign') return true;
  if (input.hasOffer) return false;
  return findLatestLoss(input.records.filter((record) => record.day >= arc.startDay)) == null;
}
