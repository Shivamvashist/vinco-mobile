import { and, eq } from 'drizzle-orm';

import { AURORA_FIRST_TRY_DENARII } from '@/features/campaign';
import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
// Aliased: the name starts with "use" but it is a database write, not a React hook.
import { useItem as spendItem } from './forum';
import { ledger } from './schema';

/**
 * Pays the denarii for beating Aurora on the first try, once a day at most.
 * Returns true when paid now, false when that day was already paid.
 */
export function awardAuroraFirstTry(db: AppDatabase, day: DayKey, now: Date = new Date()): boolean {
  return db.transaction((tx) => {
    const paid = tx
      .select({ day: ledger.day })
      .from(ledger)
      .where(and(eq(ledger.day, day), eq(ledger.reason, 'aurora_first_try')))
      .get();
    if (paid) return false;
    tx.insert(ledger)
      .values({ day, reason: 'aurora_first_try', amount: AURORA_FIRST_TRY_DENARII, createdAt: nowIso(now) })
      .onConflictDoNothing()
      .run();
    return true;
  });
}

/** Spends one alarm pass ("Venia") to stop Aurora without the mission. False when none is held. */
export function spendAlarmPass(db: AppDatabase, day: DayKey, now: Date = new Date()): boolean {
  return spendItem(db, 'venia', day, now);
}
