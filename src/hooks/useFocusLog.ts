import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, type FocusSessionRow, selectFocusSessions } from '@/db';
import { type FocusTotals, summarizeFocusLog } from '@/features/focus';

import { useToday } from './useToday';

/** The newest sessions the log lists. */
const LOG_LIMIT = 30;

export type FocusLog = {
  totals: FocusTotals;
  /** Finished sessions, newest first (the running one is left out). */
  sessions: FocusSessionRow[];
  isLoaded: boolean;
};

/** The focus log, live from focus_sessions: minutes held today, this week, all time, and the list. */
export function useFocusLog(): FocusLog {
  const today = useToday();
  const rows = useLiveQuery(selectFocusSessions(db));
  return {
    totals: summarizeFocusLog(rows.data, today),
    sessions: rows.data.filter((row) => row.status !== 'running').slice(0, LOG_LIMIT),
    isLoaded: rows.updatedAt != null,
  };
}
