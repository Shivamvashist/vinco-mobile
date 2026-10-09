import { and, gte, lte } from 'drizzle-orm';

import { arcEndDay } from '@/features/arc';
import {
  applyTruce,
  type DayRecord,
  earnsTruce,
  getCurrentCampaign,
  getDayAwards,
  getDayResult,
  isSealedResult,
  keepsCampaign,
} from '@/features/campaign';
import type { OrderTargets } from '@/features/orders';
import { addDays, type DayKey, daysBetween, eachDay } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { getDayStanding } from './dayStanding';
import { toOrderAmounts } from './orderLogs';
import { type DayLogRow, dayLogs, ledger, type OrderLogRow, orderLogs } from './schema';
import { grantTruce } from './truces';

/** The arc to seal. Without an id, only Vinco's four orders count (own orders belong to an arc). */
type ArcRange = { id?: number; startDay: DayKey; lengthDays: number };

/**
 * Seals every finished day of the arc that isn't sealed yet: today's past days, including
 * days the app wasn't opened. Each day's result (own orders included) is stored, so later
 * changes to orders never rewrite it. A missed day stays missed: Truces are called by the user
 * (callTruce). Awards denarii once per day and reason, and a Truce for every week of
 * campaign while the reserve has room. Safe to run any number of times.
 */
export function sealFinishedDays(
  db: AppDatabase,
  arc: ArcRange,
  targets: OrderTargets,
  today: DayKey,
  now: Date = new Date(),
): void {
  const yesterday = addDays(today, -1);
  const arcLastDay = arcEndDay(arc.startDay, arc.lengthDays);
  const lastDay = daysBetween(yesterday, arcLastDay) < 0 ? arcLastDay : yesterday;
  if (daysBetween(arc.startDay, lastDay) < 0) return;

  db.transaction((tx) => {
    const dayRows = new Map(
      tx
        .select()
        .from(dayLogs)
        .where(and(gte(dayLogs.day, arc.startDay), lte(dayLogs.day, lastDay)))
        .all()
        .map((row) => [row.day, row] as const),
    );
    const orderRowsByDay = groupByDay(
      tx
        .select()
        .from(orderLogs)
        .where(and(gte(orderLogs.day, arc.startDay), lte(orderLogs.day, lastDay)))
        .all(),
    );
    const records: DayRecord[] = [];
    const sealedAt = nowIso(now);

    for (const day of eachDay(arc.startDay, lastDay)) {
      const log: DayLogRow | undefined = dayRows.get(day);

      if (log?.sealedAt) {
        records.push({ day, result: sealedResult(log, orderRowsByDay.get(day) ?? [], targets) });
        continue;
      }

      const result = getDayStanding(tx, arc.id ?? null, day, targets);
      const campaignAfter = getCurrentCampaign(records, day, keepsCampaign(result));
      records.push({ day, result });

      tx.insert(dayLogs)
        .values({ day, sealedAt, result })
        .onConflictDoUpdate({ target: dayLogs.day, set: { sealedAt, result } })
        .run();
      for (const award of getDayAwards(day, result, campaignAfter)) {
        tx.insert(ledger)
          .values({ ...award, createdAt: sealedAt })
          .onConflictDoNothing()
          .run();
      }
      if (keepsCampaign(result) && earnsTruce(campaignAfter)) grantTruce(tx, day, 'campaign_week', now);
    }
  });
}

function groupByDay(rows: readonly OrderLogRow[]): Map<DayKey, OrderLogRow[]> {
  const grouped = new Map<DayKey, OrderLogRow[]>();
  for (const row of rows) grouped.set(row.day, [...(grouped.get(row.day) ?? []), row]);
  return grouped;
}

/** The query for an arc's day logs up to a day. Pass to useLiveQuery. */
export function selectDayLogsBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select()
    .from(dayLogs)
    .where(and(gte(dayLogs.day, from), lte(dayLogs.day, to)));
}

/** The query for order logs between two days. Pass to useLiveQuery. */
export function selectOrderLogsBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select()
    .from(orderLogs)
    .where(and(gte(orderLogs.day, from), lte(orderLogs.day, to)));
}

/** The query for every denarii award. Pass to useLiveQuery. */
export function selectLedger(db: AppDatabase) {
  return db.select().from(ledger);
}

/**
 * A sealed day's result: the stored one, with any Truce on top. Days sealed before results
 * were stored are computed from Vinco's four orders, as they were judged then.
 */
function sealedResult(log: DayLogRow, orderRows: readonly OrderLogRow[], targets: OrderTargets) {
  if (isSealedResult(log.result)) return applyTruce(log.result, log.truceUsed);
  return getDayResult(toOrderAmounts(orderRows), targets, log.truceUsed);
}

/** Sealed days as records. Unsealed days (today, or not yet caught up) are left out. */
export function toDayRecords(
  dayRows: readonly DayLogRow[],
  orderRows: readonly OrderLogRow[],
  targets: OrderTargets,
): DayRecord[] {
  const orderRowsByDay = groupByDay(orderRows);
  return dayRows
    .filter((row) => row.sealedAt)
    .map((row) => ({ day: row.day, result: sealedResult(row, orderRowsByDay.get(row.day) ?? [], targets) }));
}
