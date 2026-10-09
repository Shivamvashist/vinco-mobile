import { and, eq, inArray, sql } from 'drizzle-orm';

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
