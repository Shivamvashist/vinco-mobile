import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, type FocusSessionRow, selectFocusSessionsBetween, selectLedgerBetween } from '@/db';
import { type DayGloria, getDayGloria } from '@/features/gloria';
import type { DayKey } from '@/lib/dates';

import { useJourney } from './useJourney';

export type DayRewards = {
  gloria: DayGloria | null;
  /** Denarii earned (positive ledger rows) on the day. */
  denarii: number;
  /** Every focus begun that day, oldest first. */
  focusSessions: FocusSessionRow[];
  /** Minutes of focus held to the end. */
  focusMinutes: number;
  isLoaded: boolean;
};

/** One day's Gloria, denarii and focus sessions, for the day sheet. */
export function useDayRewards(day: DayKey): DayRewards {
  const journey = useJourney(day, day);
  const ledgerRows = useLiveQuery(selectLedgerBetween(db, day, day), [day]);
  const focus = useLiveQuery(selectFocusSessionsBetween(db, day, day), [day]);
  const facts = journey.days.get(day);
  return {
    gloria: facts ? getDayGloria(facts) : null,
    denarii: ledgerRows.data.reduce(
      (sum, row) => sum + (Number.isFinite(row.amount) && row.amount > 0 ? row.amount : 0),
      0,
    ),
    focusSessions: [...focus.data].sort((a, b) => a.id - b.id),
    focusMinutes: facts?.focusMinutes ?? 0,
    isLoaded: journey.isLoaded && ledgerRows.updatedAt !== undefined && focus.updatedAt !== undefined,
  };
}
