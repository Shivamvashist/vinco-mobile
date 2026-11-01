import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, type FocusSessionRow, selectFocusSessions } from '@/db';
import { firstFocusDay, type FocusTotals, summarizeFocusLog } from '@/features/focus';
import type { DayKey } from '@/lib/dates';

import { useToday } from './useToday';

/** The newest sessions the setup lists; the rest live on the full log (/focus-log). */
const RECENT_LIMIT = 3;

export type FocusLog = {
  totals: FocusTotals;
  /** The newest finished sessions, newest first (the running one is left out). */
  sessions: FocusSessionRow[];
  isLoaded: boolean;
};

export type FocusHistory = {
  today: DayKey;
  /** Every finished session, newest first (the running one is left out until it settles). */
  sessions: FocusSessionRow[];
  /** The day of the first finished focus, or null before the first. */
  firstDay: DayKey | null;
  isLoaded: boolean;
};

/** The focus log, live from focus_sessions: minutes held today, this week, all time, and the newest. */
export function useFocusLog(): FocusLog {
  const today = useToday();
  const rows = useLiveQuery(selectFocusSessions(db));
  return {
    totals: summarizeFocusLog(rows.data, today),
    sessions: rows.data.filter((row) => row.status !== 'running').slice(0, RECENT_LIMIT),
    isLoaded: rows.updatedAt != null,
  };
}

/** Every finished focus, live, for the full log's charts and list. */
export function useFocusHistory(): FocusHistory {
  const today = useToday();
  const rows = useLiveQuery(selectFocusSessions(db));
  const sessions = rows.data.filter((row) => row.status !== 'running');
  return { today, sessions, firstDay: firstFocusDay(sessions), isLoaded: rows.updatedAt != null };
}
