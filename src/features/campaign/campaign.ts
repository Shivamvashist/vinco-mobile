import { addDays, daysBetween, type DayKey, weekdayIndex } from '@/lib/dates';

import { areAllOrdersConquered, areAllOrdersHeld, type OrderAmounts, type OrderTargets } from '../orders';

/**
 * How a finished day ended.
 * conquered: all four orders at the full goal. held: all four at least at the minimum.
 * truce: missed, but the week's Truce protected the campaign. missed: the campaign breaks.
 */
export type DayResult = 'conquered' | 'held' | 'truce' | 'missed';

export type DayRecord = { day: DayKey; result: DayResult };

/** The result of a day from its order amounts. A Truce only applies to a day that was missed. */
export function getDayResult(amounts: OrderAmounts, targets: OrderTargets, truceUsed: boolean): DayResult {
  if (areAllOrdersConquered(amounts, targets)) return 'conquered';
  if (areAllOrdersHeld(amounts, targets)) return 'held';
  return truceUsed ? 'truce' : 'missed';
}

/** Days that keep a campaign going. */
export function keepsCampaign(result: DayResult): boolean {
  return result !== 'missed';
}

/** Days that count as completed for ranks (a Truce protects the campaign but isn't a completed day). */
export function countsAsCompleted(result: DayResult): boolean {
  return result === 'held' || result === 'conquered';
}

/** The Monday that starts the week a day falls in. Truces reset every Monday. */
export function weekStartOf(day: DayKey): DayKey {
  const daysSinceMonday = (weekdayIndex(day) + 6) % 7;
  return addDays(day, -daysSinceMonday);
}

/** True if no Truce was used in the same Monday-to-Sunday week as `day`. */
export function isTruceAvailable(truceDays: readonly DayKey[], day: DayKey): boolean {
  const week = weekStartOf(day);
  return !truceDays.some((truceDay) => weekStartOf(truceDay) === week);
}

/**
 * The current campaign: consecutive days that kept it, counting back from yesterday,
 * plus today once today is held. Records must be the arc's finished days (any order).
 */
export function getCurrentCampaign(
  records: readonly DayRecord[],
  today: DayKey,
  isTodayHeld: boolean,
): number {
  const byDay = new Map(records.map((record) => [record.day, record.result]));
  let length = isTodayHeld ? 1 : 0;
  let day = addDays(today, -1);
  for (;;) {
    const result = byDay.get(day);
    if (result === undefined || !keepsCampaign(result)) break;
    length += 1;
    day = addDays(day, -1);
  }
  return length;
}

/** The longest campaign in the records (today included when held). */
export function getBestCampaign(records: readonly DayRecord[], today: DayKey, isTodayHeld: boolean): number {
  const sorted = [...records].sort((a, b) => daysBetween(b.day, a.day));
  let best = 0;
  let run = 0;
  let previous: DayKey | null = null;
  for (const record of sorted) {
    const isNextDay = previous !== null && daysBetween(previous, record.day) === 1;
    run = keepsCampaign(record.result) ? (isNextDay ? run + 1 : 1) : 0;
    best = Math.max(best, run);
    previous = record.day;
  }
  return Math.max(best, getCurrentCampaign(records, today, isTodayHeld));
}

/** How many days were completed (held or conquered), today included when held. */
export function countCompletedDays(records: readonly DayRecord[], isTodayHeld: boolean): number {
  return records.filter((record) => countsAsCompleted(record.result)).length + (isTodayHeld ? 1 : 0);
}

/**
 * Resurgo, "I rise again": the campaign broke on a day and the very next day was held.
 * Returns the comeback days.
 */
export function findResurgoDays(records: readonly DayRecord[]): DayKey[] {
  const byDay = new Map(records.map((record) => [record.day, record.result]));
  return records
    .filter((record) => record.result === 'missed')
    .map((record) => addDays(record.day, 1))
    .filter((nextDay) => {
      const next = byDay.get(nextDay);
      return next !== undefined && countsAsCompleted(next);
    });
}

export type CampaignLoss = {
  /** The missed day that broke the campaign. */
  day: DayKey;
  /** How long the campaign was before it broke. */
  campaignBefore: number;
};

/** The most recent day that broke the campaign, with the campaign it ended. Null if none. */
export function findLatestLoss(records: readonly DayRecord[]): CampaignLoss | null {
  const missed = records
    .filter((record) => record.result === 'missed')
    // Oldest first, so the last one is the latest.
    .sort((a, b) => daysBetween(b.day, a.day))
    .at(-1);
  if (!missed) return null;
  const before = records.filter((record) => daysBetween(record.day, missed.day) > 0);
  return { day: missed.day, campaignBefore: getCurrentCampaign(before, missed.day, false) };
}
