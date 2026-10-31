/**
 * The focus log: minutes held today, this week (Monday to Sunday) and all time. Only a focus held
 * to the end counts (its Gloria: focusGloria in features/gloria, from heldMinutes). Pure.
 */
import { addDays, type DayKey, weekdayIndex } from '@/lib/dates';

import type { FocusStatus } from './focus';

export type FocusLogFacts = { day: DayKey; minutes: number; status: FocusStatus };

export type FocusTotals = { today: number; week: number; allTime: number };

/** Minutes a session counts for: its length when held to the end, otherwise none. */
export function heldMinutes(session: { minutes: number; status: string }): number {
  if (session.status !== 'completed' || !Number.isFinite(session.minutes)) return 0;
  return Math.max(0, Math.round(session.minutes));
}

/** The Monday that starts the week holding `day`. */
export function weekStartOf(day: DayKey): DayKey {
  return addDays(day, -((weekdayIndex(day) + 6) % 7));
}

/** Minutes held today, this week and all time. */
export function summarizeFocusLog(sessions: readonly FocusLogFacts[], today: DayKey): FocusTotals {
  const weekStart = weekStartOf(today);
  const totals: FocusTotals = { today: 0, week: 0, allTime: 0 };
  for (const session of sessions) {
    const minutes = heldMinutes(session);
    if (minutes === 0) continue;
    totals.allTime += minutes;
    if (session.day >= weekStart && session.day <= today) totals.week += minutes;
    if (session.day === today) totals.today += minutes;
  }
  return totals;
}
