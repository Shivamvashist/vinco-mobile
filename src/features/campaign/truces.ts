import { addDays, type DayKey } from '@/lib/dates';

import { type DayRecord, getCurrentCampaign } from './campaign';

/**
 * Truces are called by the user, never applied automatically. A missed day breaks the
 * campaign unless the user spends a Truce on it before the next day ends.
 * Truces are earned (one when an arc begins, then one every week of campaign) or bought
 * with denarii at the moment of need. Numbers are tunable with Early Access data.
 */
export const TRUCES = {
  /** One Truce is earned for every this many days of campaign. */
  earnedEveryCampaignDays: 7,
  /** Most Truces held in reserve at once. Earning stops at this many. */
  maxHeld: 3,
  /** Denarii for one Truce when none are in reserve. */
  priceDenarii: 50,
} as const;

/** Why a Truce was added (+1) or taken (-1). One row per day and reason. */
export type TruceReason = 'arc_start' | 'campaign_week' | 'bought' | 'spent';

export type TrucePayment = {
  /** Truces taken from the reserve. */
  fromReserve: number;
  /** Truces bought with denarii. */
  toBuy: number;
  /** Denarii spent. */
  cost: number;
  canAfford: boolean;
};

/** How a number of Truces would be paid for: the reserve first, then denarii. */
export function planTrucePayment(needed: number, reserve: number, denarii: number): TrucePayment {
  const count = Math.max(0, Math.floor(needed));
  const fromReserve = Math.min(count, Math.max(0, Math.floor(reserve)));
  const toBuy = count - fromReserve;
  const cost = toBuy * TRUCES.priceDenarii;
  return { fromReserve, toBuy, cost, canAfford: count > 0 && cost <= Math.max(0, denarii) };
}

/**
 * The missed days a Truce can still cover: the unbroken run of missed days that ends
 * yesterday, oldest first. Empty once a later day is sealed or when yesterday wasn't missed.
 */
export function findTruceableDays(records: readonly DayRecord[], today: DayKey): DayKey[] {
  const byDay = new Map(records.map((record) => [record.day, record.result]));
  const days: DayKey[] = [];
  let day = addDays(today, -1);
  while (byDay.get(day) === 'missed') {
    days.unshift(day);
    day = addDays(day, -1);
  }
  return days;
}

export type TruceOffer = TrucePayment & {
  /** The missed days the Truce would cover, oldest first. */
  days: DayKey[];
  /** The campaign that carries on if the Truce is called. */
  campaignSaved: number;
};

/**
 * What calling a Truce would save and cost right now, or null when there is nothing worth
 * saving (no missed run ending yesterday, or no campaign before it).
 */
export function getTruceOffer(
  records: readonly DayRecord[],
  today: DayKey,
  reserve: number,
  denarii: number,
): TruceOffer | null {
  const days = findTruceableDays(records, today);
  const firstMissed = days[0];
  if (!firstMissed) return null;
  const before = records.filter((record) => record.day < firstMissed);
  const campaignSaved = getCurrentCampaign(before, firstMissed, false);
  if (campaignSaved === 0) return null;
  return { days, campaignSaved, ...planTrucePayment(days.length, reserve, denarii) };
}

/** True when sealing a day that ends a campaign of this length earns a Truce. */
export function earnsTruce(campaignAfter: number): boolean {
  return campaignAfter > 0 && campaignAfter % TRUCES.earnedEveryCampaignDays === 0;
}
