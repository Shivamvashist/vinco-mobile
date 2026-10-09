import type { DayKey } from '@/lib/dates';

import type { DayResult } from './campaign';

/**
 * Earned by holding the line, never bought with real money. Spent on Truces (a negative row).
 * Amounts from the product plan; tune with Early Access data.
 */
export const DENARII = {
  dayHeld: 5,
  dayConquered: 10,
  /** Every 7 days of campaign. */
  campaignWeek: 25,
} as const;

export type LedgerReason = 'day_held' | 'day_conquered' | 'campaign_week' | 'truce_bought';

export type LedgerAward = { day: DayKey; reason: LedgerReason; amount: number };

/**
 * What a sealed day earns. Each (day, reason) pair is unique, so writing these
 * with "insert or ignore" can never pay twice for the same thing.
 * @param campaignAfter the campaign length including this day
 */
export function getDayAwards(day: DayKey, result: DayResult, campaignAfter: number): LedgerAward[] {
  const awards: LedgerAward[] = [];
  if (result === 'conquered') awards.push({ day, reason: 'day_conquered', amount: DENARII.dayConquered });
  if (result === 'held') awards.push({ day, reason: 'day_held', amount: DENARII.dayHeld });
  const isWeekMilestone = result !== 'missed' && campaignAfter > 0 && campaignAfter % 7 === 0;
  if (isWeekMilestone) awards.push({ day, reason: 'campaign_week', amount: DENARII.campaignWeek });
  return awards;
}
