import type { DayKey } from '@/lib/dates';

import type { DayResult } from './campaign';
import { getStreakAwards } from './streak';

/**
 * Earned by holding the line, never bought with real money. Spent on Truces (a negative row).
 * Amounts from the product plan; tune with Early Access data. The run's own pay is in streak.ts.
 */
export const DENARII = {
  dayHeld: 5,
  dayConquered: 10,
} as const;

/** Beating Aurora on the first try. */
export const AURORA_FIRST_TRY_DENARII = 2;

/** Dev builds only: what one press of "Add denarii" gives. */
export const DEV_GRANT_DENARII = 100;

/** Streak (Stipendium) rewards, one reason per step so (day, reason) stays unique. */
export type StreakReason = 'streak_day3' | 'streak_day5' | 'streak_day7' | 'streak_milestone';

export type LedgerReason =
  | 'day_held'
  | 'day_conquered'
  /** Before 31 Oct 2026: every 7 days of campaign. Kept for old rows; streak_day7 replaced it. */
  | 'campaign_week'
  | 'truce_bought'
  | StreakReason
  /** Beating Aurora's mission on the first try. */
  | 'aurora_first_try'
  /** Dev builds only: the dev panel's "Add denarii". */
  | 'dev_grant'
  | FocusReason;

/** A completed focus (Acies). One reason per rewarded session, at most three a day. */
export type FocusReason = 'focus_1' | 'focus_2' | 'focus_3';

/** The day's rewarded focus sessions, in order. */
export const FOCUS_REASONS: readonly FocusReason[] = ['focus_1', 'focus_2', 'focus_3'];

/**
 * Paid the moment today holds and taken back if it stops holding, until midnight seals the day
 * (sealing writes the final rows in their place). Never includes Truce or Forum rows.
 */
export const LIVE_LEDGER_REASONS: readonly LedgerReason[] = [
  'day_held',
  'day_conquered',
  'streak_day3',
  'streak_day5',
  'streak_day7',
  'streak_milestone',
];

export type LedgerAward = { day: DayKey; reason: LedgerReason; amount: number };

/**
 * What a day earns: its own pay (held or conquered) and the run's pay. Each (day, reason) pair
 * is unique, so writing these can never pay twice for the same thing.
 * @param streak the run including this day (campaign or free training alike)
 */
export function getDayAwards(day: DayKey, result: DayResult, streak: number): LedgerAward[] {
  const awards: LedgerAward[] = [];
  if (result === 'conquered') awards.push({ day, reason: 'day_conquered', amount: DENARII.dayConquered });
  if (result === 'held') awards.push({ day, reason: 'day_held', amount: DENARII.dayHeld });
  return [...awards, ...getStreakAwards(day, result, streak)];
}

/** The total of a list of awards. */
export function sumAwards(awards: readonly { amount: number }[]): number {
  return awards.reduce((sum, award) => sum + (Number.isFinite(award.amount) ? award.amount : 0), 0);
}
