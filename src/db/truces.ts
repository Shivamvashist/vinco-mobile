import { and, eq, inArray, sql } from 'drizzle-orm';

import { getDayLog, updateDayLog } from './dayLogs';

import { planTrucePayment, type TrucePayment, type TruceReason, TRUCES } from '@/features/campaign';
import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { dayLogs, ledger, truces } from './schema';

/** The query for every Truce change. Pass to useLiveQuery; the reserve is the sum. */
export function selectTruces(db: AppDatabase) {
  return db.select().from(truces);
}

/** Truces in reserve now. */
export function getTruceReserve(db: AppDatabase): number {
  const row = db
    .select({ total: sql<number>`coalesce(sum(${truces.amount}), 0)` })
    .from(truces)
    .get();
  return Number(row?.total ?? 0);
}

/** Denarii held now (earned minus spent). */
export function getDenariiBalance(db: AppDatabase): number {
  const row = db
    .select({ total: sql<number>`coalesce(sum(${ledger.amount}), 0)` })
    .from(ledger)
    .get();
  return Number(row?.total ?? 0);
}

/**
 * Adds one Truce to the reserve unless it is full. Granting the same (day, reason) twice
 * does nothing. Returns true if a Truce was added.
 */
export function grantTruce(
  db: AppDatabase,
  day: DayKey,
  reason: Extract<TruceReason, 'arc_start' | 'campaign_week'>,
  now: Date = new Date(),
): boolean {
  if (getTruceReserve(db) >= TRUCES.maxHeld) return false;
  const inserted = db
    .insert(truces)
    .values({ day, reason, amount: 1, createdAt: nowIso(now) })
    .onConflictDoNothing()
    .returning({ day: truces.day })
    .all();
  return inserted.length > 0;
}

/** Why a Truce could not be called. */
export class TruceError extends Error {
  readonly reason: 'cannot_afford' | 'nothing_to_cover';

  constructor(reason: 'cannot_afford' | 'nothing_to_cover') {
    super(`Truce refused: ${reason}`);
    this.name = 'TruceError';
    this.reason = reason;
  }
}

/**
 * Calls a Truce on sealed missed days (the days from getTruceOffer), in one transaction:
 * spends the reserve first, then buys the rest with denarii. Days already under a Truce are
 * skipped, so a double tap never pays twice. Throws TruceError when there is nothing to
 * cover or the denarii fall short.
 */
export function callTruce(db: AppDatabase, days: readonly DayKey[], now: Date = new Date()): TrucePayment {
  return db.transaction((tx) => {
    // Only sealed days not yet under a Truce, oldest first.
    const toCover =
      days.length === 0
        ? []
        : tx
            .select({ day: dayLogs.day, sealedAt: dayLogs.sealedAt })
            .from(dayLogs)
            .where(and(inArray(dayLogs.day, [...days]), eq(dayLogs.truceUsed, false)))
            .all()
            .filter((row) => row.sealedAt)
            .map((row) => row.day)
            .sort();
    if (toCover.length === 0) throw new TruceError('nothing_to_cover');

    const payment = planTrucePayment(toCover.length, getTruceReserve(tx), getDenariiBalance(tx));
    if (!payment.canAfford) throw new TruceError('cannot_afford');

    const createdAt = nowIso(now);
    toCover.forEach((day, index) => {
      if (index >= payment.fromReserve) {
        tx.insert(truces).values({ day, reason: 'bought', amount: 1, createdAt }).run();
        tx.insert(ledger)
          .values({ day, reason: 'truce_bought', amount: -TRUCES.priceDenarii, createdAt })
          .run();
      }
      tx.insert(truces).values({ day, reason: 'spent', amount: -1, createdAt }).run();
      tx.update(dayLogs).set({ truceUsed: true }).where(eq(dayLogs.day, day)).run();
    });
    return payment;
  });
}

/**
 * A sick day: calls a Truce for today, before the day is over, so the campaign is safe even
 * if no order is done. Paid like any Truce (reserve first, then denarii). Calling it twice
 * does nothing. Throws TruceError('cannot_afford'), or ('nothing_to_cover') once sealed.
 * If every order is held anyway, sealing gives the Truce back (see sealFinishedDays).
 */
export function callSickDay(db: AppDatabase, day: DayKey, now: Date = new Date()): TrucePayment | null {
  return db.transaction((tx) => {
    const log = getDayLog(tx, day);
    if (log?.sealedAt) throw new TruceError('nothing_to_cover');
    if (log?.truceUsed) return null;
    const payment = planTrucePayment(1, getTruceReserve(tx), getDenariiBalance(tx));
    if (!payment.canAfford) throw new TruceError('cannot_afford');
    const createdAt = nowIso(now);
    if (payment.toBuy > 0) {
      tx.insert(truces).values({ day, reason: 'bought', amount: 1, createdAt }).run();
      tx.insert(ledger)
        .values({ day, reason: 'truce_bought', amount: -TRUCES.priceDenarii, createdAt })
        .run();
    }
    tx.insert(truces).values({ day, reason: 'spent', amount: -1, createdAt }).run();
    updateDayLog(tx, day, { truceUsed: true });
    return payment;
  });
}

/**
 * "I'm feeling better": takes back today's sick-day Truce before the day is sealed, as if it
 * was never called (the Truce, and any denarii paid, come back). Does nothing once sealed.
 */
export function cancelSickDay(db: AppDatabase, day: DayKey): void {
  db.transaction((tx) => {
    const log = getDayLog(tx, day);
    if (!log?.truceUsed || log.sealedAt) return;
    tx.delete(truces)
      .where(and(eq(truces.day, day), inArray(truces.reason, ['spent', 'bought'])))
      .run();
    tx.delete(ledger)
      .where(and(eq(ledger.day, day), eq(ledger.reason, 'truce_bought')))
      .run();
    updateDayLog(tx, day, { truceUsed: false });
  });
}

/** Gives back a sick-day Truce for a day that was held anyway. Once per day. */
export function refundTruce(db: AppDatabase, day: DayKey, now: Date = new Date()): void {
  db.insert(truces)
    .values({ day, reason: 'refunded', amount: 1, createdAt: nowIso(now) })
    .onConflictDoNothing()
    .run();
}
