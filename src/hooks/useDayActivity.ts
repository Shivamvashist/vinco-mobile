import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import {
  db,
  selectClaimsBetween,
  selectCustomOrderLogsBetween,
  selectDayLog,
  selectFocusOn,
  selectOrderLogsForDay,
  selectOrderStepsForDay,
  selectTaskCompletionsBetween,
  selectTruceSpendsBetween,
} from '@/db';
import { collectDayActivity, type DayActivity } from '@/features/dayPath';
import { addDays, type DayKey, toDayKey } from '@/lib/dates';

/** How far back a Truce call on missed days is looked for (a call covers the run ending yesterday). */
const TRUCE_LOOKBACK_DAYS = 7;

export type DayActivityState = {
  /** Everything the user did on the day, oldest first. */
  items: DayActivity[];
  /** False until every source has been read once, so the first marks never pop in as new. */
  isLoaded: boolean;
};

/**
 * A day's activity for the day path on Today, from live queries (nothing copied into a store):
 * order steps, wake-up, to-dos, focus, proof logs, claims and Truces. See features/dayPath.
 * @param now the minute clock, for a running focus and Truces called today
 */
export function useDayActivity(day: DayKey, now: Date): DayActivityState {
  const steps = useLiveQuery(selectOrderStepsForDay(db, day), [day]);
  const orderLogs = useLiveQuery(selectOrderLogsForDay(db, day), [day]);
  const ownLogs = useLiveQuery(selectCustomOrderLogsBetween(db, day, day), [day]);
  const dayLog = useLiveQuery(selectDayLog(db, day), [day]);
  const completions = useLiveQuery(selectTaskCompletionsBetween(db, day, day), [day]);
  const focus = useLiveQuery(selectFocusOn(db, day), [day]);
  const claims = useLiveQuery(selectClaimsBetween(db, day, day), [day]);
  const truces = useLiveQuery(selectTruceSpendsBetween(db, addDays(day, -TRUCE_LOOKBACK_DAYS), day), [day]);

  const sources = [steps, orderLogs, ownLogs, dayLog, completions, focus, claims, truces];
  const items = collectDayActivity({
    day,
    realDay: toDayKey(now),
    now,
    steps: steps.data,
    orderLogs: orderLogs.data,
    ownOrderLogs: ownLogs.data.filter((row) => row.day === day),
    dayLog: dayLog.data[0] ?? null,
    taskCompletions: completions.data,
    focusSessions: focus.data,
    claims: claims.data,
    truceSpends: truces.data,
  });

  return { items, isLoaded: sources.every((source) => source.updatedAt !== undefined) };
}
