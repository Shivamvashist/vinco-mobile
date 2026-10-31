import type { DayKey } from '@/lib/dates';

import { countsAsCompleted, type DayResult } from './campaign';
import type { StreakReason } from './denarii';
import { TRUCES } from './truces';

/**
 * The Stipendium (a soldier's pay): rewards for a run of held days, in a campaign and in free
 * training alike. Each week of the run pays on days 3, 5 and 7; long runs pay a milestone bonus.
 * Truces stay campaign only (free training has none): one every 7 days, from truces.ts.
 * Amounts are first guesses; tune with Early Access data.
 */
export const STREAK = {
  /** Day of each 7-day week of the run, and its pay. */
  weekly: [
    { dayOfWeek: 3, reason: 'streak_day3', amount: 10 },
    { dayOfWeek: 5, reason: 'streak_day5', amount: 15 },
    { dayOfWeek: 7, reason: 'streak_day7', amount: 25 },
  ],
  /** Run lengths that pay a bonus on top of the weekly pay. */
  milestones: [
    { day: 14, amount: 50 },
    { day: 30, amount: 100 },
    { day: 60, amount: 200 },
    { day: 100, amount: 300 },
  ],
  weekLength: 7,
} as const satisfies {
  weekly: readonly { dayOfWeek: number; reason: StreakReason; amount: number }[];
  milestones: readonly { day: number; amount: number }[];
  weekLength: number;
};

export type StreakAward = { day: DayKey; reason: StreakReason; amount: number };

/** Day 1 to 7 within the current week of a run. 0 when there is no run. */
export function dayOfStreakWeek(streak: number): number {
  if (!Number.isFinite(streak) || streak < 1) return 0;
  return ((Math.floor(streak) - 1) % STREAK.weekLength) + 1;
}

/**
 * What a held day pays for the run it extends.
 * @param streak the run including this day
 * @param result only a held or conquered day pays (a Truce day keeps the run but earns nothing)
 */
export function getStreakAwards(day: DayKey, result: DayResult, streak: number): StreakAward[] {
  if (!countsAsCompleted(result) || streak < 1) return [];
  const awards: StreakAward[] = [];
  const weekDay = dayOfStreakWeek(streak);
  for (const step of STREAK.weekly) {
    if (step.dayOfWeek === weekDay) awards.push({ day, reason: step.reason, amount: step.amount });
  }
  const milestone = STREAK.milestones.find((item) => item.day === streak);
  if (milestone) awards.push({ day, reason: 'streak_milestone', amount: milestone.amount });
  return awards;
}

export type NextStreakReward = {
  /** Held days still needed, counting the next one as 1. */
  inDays: number;
  /** The run length that pays. */
  atStreak: number;
  denarii: number;
  /** A campaign grants a Truce on that day. */
  hasTruce: boolean;
};

/**
 * The next reward after a run of this length: what the next held days would pay first.
 * @param streak the run so far (today included once today holds)
 * @param hasTruces false in free training, which has no Truces
 */
export function getNextStreakReward(streak: number, hasTruces: boolean): NextStreakReward {
  const current = Number.isFinite(streak) ? Math.max(0, Math.floor(streak)) : 0;
  // A reward is always at most a few days away: every week pays on day 3.
  for (let atStreak = current + 1; ; atStreak += 1) {
    const denarii = getStreakAwards('', 'held', atStreak).reduce((sum, award) => sum + award.amount, 0);
    const hasTruce = hasTruces && atStreak % TRUCES.earnedEveryCampaignDays === 0;
    if (denarii > 0 || hasTruce) return { inDays: atStreak - current, atStreak, denarii, hasTruce };
  }
}
