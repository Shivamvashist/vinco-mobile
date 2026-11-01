import { and, asc, eq, gte, inArray, lte, ne } from 'drizzle-orm';

import {
  checkReelPass,
  nextReelPassReason,
  REEL_PASS,
  REEL_PASS_REASONS,
  type ReelDay,
  type ReelPassCheck,
} from '@/features/guard';
import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { getDenariiBalance } from './forum';
import { ledger, reelDays } from './schema';

/**
 * Copies the phone's reel counts into the table, in one transaction. The native module is the
 * source of truth, so each day takes the native count as it is (a row is only written when it
 * changed). Days the module no longer keeps stay as they were.
 */
export function saveReelDays(db: AppDatabase, days: readonly ReelDay[], now: Date = new Date()): void {
  if (days.length === 0) return;
  const updatedAt = nowIso(now);
  db.transaction((tx) => {
    for (const { day, count } of days) {
      tx.insert(reelDays)
        .values({ day, count, updatedAt })
        .onConflictDoUpdate({
          target: reelDays.day,
          set: { count, updatedAt },
          // Skips the write (and a live-query refresh) when the stored count is already right.
          setWhere: ne(reelDays.count, count),
        })
        .run();
    }
  });
}

/** The days between `from` and `to` (inclusive) that have a row, oldest first. */
export function selectReelDaysBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select()
    .from(reelDays)
    .where(and(gte(reelDays.day, from), lte(reelDays.day, to)))
    .orderBy(asc(reelDays.day));
}

/** Every kept day, oldest first (one small row a day). Pass to useLiveQuery. */
export function selectReelDays(db: AppDatabase) {
  return db.select().from(reelDays).orderBy(asc(reelDays.day));
}

/** Every reel pass bought, as ledger rows (day, reason). Pass to useLiveQuery. */
export function selectReelPasses(db: AppDatabase) {
  return db
    .select({ day: ledger.day, reason: ledger.reason })
    .from(ledger)
    .where(inArray(ledger.reason, [...REEL_PASS_REASONS]));
}

/** Why a reel pass was refused. */
export class ReelPassError extends Error {
  readonly reason: Exclude<ReelPassCheck, 'ok'>;

  constructor(reason: Exclude<ReelPassCheck, 'ok'>) {
    super(`Reel pass refused: ${reason}`);
    this.name = 'ReelPassError';
    this.reason = reason;
  }
}

/**
 * Buys a reel pass for `day` with denarii, in one transaction: the price leaves the ledger as
 * 'reel_pass_<n>' (so every balance already counts it). Idempotent: `seenPasses` is how many the
 * user saw used when they confirmed, and if more are already there (a double tap, a second screen)
 * nothing is bought again ('alreadyBought'). Throws ReelPassError when the limit or the balance
 * refuses it; the balance never goes below zero.
 */
export function buyReelPass(
  db: AppDatabase,
  day: DayKey,
  seenPasses: number,
  now: Date = new Date(),
): 'bought' | 'alreadyBought' {
  return db.transaction((tx) => {
    const used = tx
      .select({ reason: ledger.reason })
      .from(ledger)
      .where(and(eq(ledger.day, day), inArray(ledger.reason, [...REEL_PASS_REASONS])))
      .all().length;
    if (used > Math.max(0, Math.floor(seenPasses))) return 'alreadyBought';
    const check = checkReelPass(getDenariiBalance(tx), used);
    if (check !== 'ok') throw new ReelPassError(check);
    const reason = nextReelPassReason(used);
    if (reason == null) throw new ReelPassError('dailyLimit');
    tx.insert(ledger)
      .values({ day, reason, amount: -REEL_PASS.price, createdAt: nowIso(now) })
      .onConflictDoNothing()
      .run();
    return 'bought';
  });
}
