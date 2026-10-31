import { and, eq, gte, inArray, lt } from 'drizzle-orm';

import { arcEndDay } from '@/features/arc';
import {
  DEV_GRANT_DENARII,
  getCurrentCampaign,
  getDayAwards,
  type LedgerAward,
  LIVE_LEDGER_REASONS,
  sumAwards,
} from '@/features/campaign';
import type { OrderTargets } from '@/features/orders';
import type { DayKey } from '@/lib/dates';

import { getActiveArc } from './arcs';
import { type AppDatabase, nowIso } from './database';
import { getDayStanding } from './dayStanding';
import { toDayRecords } from './sealing';
import { dayLogs, ledger, orderLogs } from './schema';

/**
 * Replaces a day's live awards (its held or conquered pay and the run's pay) with these.
 * Truce, Forum, Aurora and dev rows are never touched. Returns the change in denarii.
 */
export function replaceDayAwards(
  db: AppDatabase,
  day: DayKey,
  awards: readonly LedgerAward[],
  now: Date = new Date(),
): number {
  const where = and(eq(ledger.day, day), inArray(ledger.reason, [...LIVE_LEDGER_REASONS]));
  const before = sumAwards(db.select({ amount: ledger.amount }).from(ledger).where(where).all());
  db.delete(ledger).where(where).run();
  const createdAt = nowIso(now);
  for (const award of awards) {
    db.insert(ledger)
      .values({ ...award, createdAt })
      .onConflictDoNothing()
      .run();
  }
  return sumAwards(awards) - before;
}

/**
 * Pays today's denarii the moment today holds, and takes them back if it stops holding: the day's
 * own pay and the run's (streak) pay, in both a campaign and free training. Midnight sealing
 * writes the final rows in their place. Run inside the transaction that changed an order.
 * Returns the change in denarii (positive when paid, negative when taken back).
 */
export function syncTodayAwards(
  db: AppDatabase,
  today: DayKey,
  targets: OrderTargets,
  now: Date = new Date(),
): number {
  const arc = getActiveArc(db);
  // With no arc, before it starts or after its last day (never sealed), today pays nothing.
  if (!arc || today < arc.startDay || today > arcEndDay(arc.startDay, arc.lengthDays)) {
    return replaceDayAwards(db, today, [], now);
  }
  const result = getDayStanding(db, arc.id, today, targets);
  if (result === 'missed') return replaceDayAwards(db, today, [], now);
  const records = toDayRecords(
    db
      .select()
      .from(dayLogs)
      .where(and(gte(dayLogs.day, arc.startDay), lt(dayLogs.day, today)))
      .all(),
    db
      .select()
      .from(orderLogs)
      .where(and(gte(orderLogs.day, arc.startDay), lt(orderLogs.day, today)))
      .all(),
    targets,
  );
  const streak = getCurrentCampaign(records, today, true);
  return replaceDayAwards(db, today, getDayAwards(today, result, streak), now);
}

/**
 * DEV ONLY: adds denarii for testing the Forum. One row per day, so repeated presses add up on it.
 * Returns the day's dev total.
 */
export function grantDevDenarii(
  db: AppDatabase,
  day: DayKey,
  amount: number = DEV_GRANT_DENARII,
  now: Date = new Date(),
): number {
  return db.transaction((tx) => {
    const where = and(eq(ledger.day, day), eq(ledger.reason, 'dev_grant'));
    const current = tx.select({ amount: ledger.amount }).from(ledger).where(where).get()?.amount ?? 0;
    const total = current + amount;
    tx.insert(ledger)
      .values({ day, reason: 'dev_grant', amount: total, createdAt: nowIso(now) })
      .onConflictDoUpdate({ target: [ledger.day, ledger.reason], set: { amount: total } })
      .run();
    return total;
  });
}
