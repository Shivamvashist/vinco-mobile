import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import {
  db,
  selectAllArcOrders,
  selectAllCustomOrders,
  selectArcsForJourney,
  selectClaimsBetween,
  selectCustomOrderLogsBetween,
  selectDayLogsBetween,
  selectFocusSessionsBetween,
  selectOrderLogsBetween,
  selectTaskCompletionsBetween,
  toJourneyInput,
} from '@/db';
import { buildJourneyDays, type JourneyDay } from '@/features/gloria';
import type { DayKey } from '@/lib/dates';

export type Journey = {
  /** Every day from `from` to `to`, with its facts. */
  days: Map<DayKey, JourneyDay>;
  /** The earliest arc's first day, or null before onboarding. */
  firstDay: DayKey | null;
  isLoaded: boolean;
};

/**
 * The journey's days between two days, live from the records: orders, results, to-dos, focus,
 * selfie, weight, wake-up and claims. The Labours and Gloria read from here.
 * @param from the first day, or null for the journey's first arc day
 */
export function useJourney(from: DayKey | null, to: DayKey): Journey {
  const arcRows = useLiveQuery(selectArcsForJourney(db));
  const firstDay = arcRows.data.reduce<DayKey | null>(
    (first, arc) => (first == null || arc.startDay < first ? arc.startDay : first),
    null,
  );
  const start = from ?? firstDay ?? to;
  const arcOrderRows = useLiveQuery(selectAllArcOrders(db));
  const customOrders = useLiveQuery(selectAllCustomOrders(db));
  const orderLogs = useLiveQuery(selectOrderLogsBetween(db, start, to), [start, to]);
  const customLogs = useLiveQuery(selectCustomOrderLogsBetween(db, start, to), [start, to]);
  const dayLogs = useLiveQuery(selectDayLogsBetween(db, start, to), [start, to]);
  const ticks = useLiveQuery(selectTaskCompletionsBetween(db, start, to), [start, to]);
  const focus = useLiveQuery(selectFocusSessionsBetween(db, start, to), [start, to]);
  const claims = useLiveQuery(selectClaimsBetween(db, start, to), [start, to]);

  const input = toJourneyInput({
    arcRows: arcRows.data,
    arcOrderRows: arcOrderRows.data,
    customOrders: customOrders.data,
    orderLogs: orderLogs.data,
    customLogs: customLogs.data,
    dayLogs: dayLogs.data,
    taskCompletions: ticks.data,
    focusSessions: focus.data,
    claims: claims.data,
  });

  return {
    days: buildJourneyDays(input, start, to),
    firstDay,
    isLoaded: [
      arcRows,
      arcOrderRows,
      customOrders,
      orderLogs,
      customLogs,
      dayLogs,
      ticks,
      focus,
      claims,
    ].every((query) => query.updatedAt !== undefined),
  };
}
