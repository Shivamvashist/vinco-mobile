/**
 * The full focus log (the /focus-log screen): a week, month or year of focus as bars and totals.
 * A focus counts on the day it began, even when it ran past midnight; a running one is left out
 * until it settles. Held minutes are the session's length; a retreat shows the minutes it lasted
 * before the retreat, apart, and never counts as held. Pure.
 */
import { bucketSums, isInPeriod, longestDayRun, type Period } from '@/features/periods';
import type { DayKey } from '@/lib/dates';

import { type FocusGuard, isFocusGuard } from './focus';
import { heldMinutes } from './log';

/** What a saved session needs here (a database row fits). */
export type FocusHistoryFacts = {
  day: DayKey;
  guard: string;
  minutes: number;
  status: string;
  startedAt: string;
  endedAt: string | null;
};

export type FocusPeriodBars = {
  /** Minutes held per bar. */
  held: number[];
  /** Minutes a retreated focus lasted, per bar. */
  retreated: number[];
};

export type FocusPeriodSummary = {
  minutesHeld: number;
  sessionsHeld: number;
  sessionsRetreated: number;
  /** The day with the most minutes held, or null when none were. */
  bestDay: { day: DayKey; minutes: number } | null;
  /** The longest run of days in a row with a focus held. */
  longestRun: number;
  /** Minutes held under each guard. */
  byGuard: Record<FocusGuard, number>;
};

/**
 * Minutes a retreated focus lasted, from its start to its end, kept within its planned length (a
 * clock moved backwards reads 0). Held and running sessions read 0.
 */
export function retreatedMinutes(
  session: Pick<FocusHistoryFacts, 'minutes' | 'status' | 'startedAt' | 'endedAt'>,
): number {
  if (session.status !== 'abandoned' || session.endedAt == null) return 0;
  const lasted = (Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 60_000;
  if (!Number.isFinite(lasted) || !Number.isFinite(session.minutes)) return 0;
  return Math.max(0, Math.min(Math.round(session.minutes), Math.floor(lasted)));
}

/** Finished sessions (held or retreated) that began inside a period, in the order given. */
export function sessionsInPeriod<Session extends FocusHistoryFacts>(
  sessions: readonly Session[],
  period: Period,
): Session[] {
  return sessions.filter((session) => session.status !== 'running' && isInPeriod(period, session.day));
}

/** A period's bars: minutes held, and minutes of retreated focus, per bar. */
export function focusPeriodBars(sessions: readonly FocusHistoryFacts[], period: Period): FocusPeriodBars {
  const byDay = (session: FocusHistoryFacts) => session.day;
  return {
    held: bucketSums(period, sessions, byDay, heldMinutes),
    retreated: bucketSums(period, sessions, byDay, retreatedMinutes),
  };
}

/** The period's totals: minutes and sessions held, retreats, the best day, the longest run, the guards. */
export function summarizeFocusPeriod(
  sessions: readonly FocusHistoryFacts[],
  period: Period,
): FocusPeriodSummary {
  const summary: FocusPeriodSummary = {
    minutesHeld: 0,
    sessionsHeld: 0,
    sessionsRetreated: 0,
    bestDay: null,
    longestRun: 0,
    byGuard: { custos: 0, imperium: 0, silentium: 0 },
  };
  const heldByDay = new Map<DayKey, number>();
  for (const session of sessionsInPeriod(sessions, period)) {
    if (session.status === 'abandoned') {
      summary.sessionsRetreated += 1;
      continue;
    }
    const minutes = heldMinutes(session);
    if (session.status !== 'completed') continue;
    summary.sessionsHeld += 1;
    summary.minutesHeld += minutes;
    if (isFocusGuard(session.guard)) summary.byGuard[session.guard] += minutes;
    heldByDay.set(session.day, (heldByDay.get(session.day) ?? 0) + minutes);
  }
  for (const [day, minutes] of heldByDay) {
    const best = summary.bestDay;
    if (
      minutes > 0 &&
      (best == null || minutes > best.minutes || (minutes === best.minutes && day < best.day))
    ) {
      summary.bestDay = { day, minutes };
    }
  }
  summary.longestRun = longestDayRun([...heldByDay].filter(([, minutes]) => minutes > 0).map(([day]) => day));
  return summary;
}

/** The first day with a finished focus, or null before the first. */
export function firstFocusDay(sessions: readonly Pick<FocusHistoryFacts, 'day' | 'status'>[]): DayKey | null {
  let first: DayKey | null = null;
  for (const session of sessions) {
    if (session.status === 'running') continue;
    if (first == null || session.day < first) first = session.day;
  }
  return first;
}
