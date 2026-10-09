import { and, gte, lte } from 'drizzle-orm';

import { arcEndDay } from '@/features/arc';
import {
  type DayRecord,
  getCurrentCampaign,
  getDayAwards,
  getDayResult,
  isTruceAvailable,
  keepsCampaign,
} from '@/features/campaign';
import type { OrderTargets } from '@/features/orders';
import { addDays, type DayKey, daysBetween, eachDay } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { toOrderAmounts } from './orderLogs';
import { type DayLogRow, dayLogs, ledger, type OrderLogRow, orderLogs } from './schema';

type ArcRange = { startDay: DayKey; lengthDays: number };

/**
 * Seals every finished day of the arc that isn't sealed yet: today's past days, including
 * days the app wasn't opened. A missed day takes the week's Truce automatically if it is
 * still free. Awards denarii once per day and reason. Safe to run any number of times.
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
    const truceDays = [...dayRows.values()].filter((row) => row.truceUsed).map((row) => row.day);
    const records: DayRecord[] = [];
    const sealedAt = nowIso(now);

    for (const day of eachDay(arc.startDay, lastDay)) {
      const log: DayLogRow | undefined = dayRows.get(day);
      const amounts = toOrderAmounts(orderRowsByDay.get(day) ?? []);

      if (log?.sealedAt) {
        records.push({ day, result: getDayResult(amounts, targets, log.truceUsed) });
        continue;
      }

      let result = getDayResult(amounts, targets, false);
      const takesTruce = result === 'missed' && isTruceAvailable(truceDays, day);
      if (takesTruce) {
        result = 'truce';
        truceDays.push(day);
      }

      const campaignAfter = getCurrentCampaign(records, day, keepsCampaign(result));
      records.push({ day, result });

      tx.insert(dayLogs)
        .values({ day, sealedAt, truceUsed: takesTruce })
        .onConflictDoUpdate({ target: dayLogs.day, set: { sealedAt, truceUsed: takesTruce } })
        .run();
      for (const award of getDayAwards(day, result, campaignAfter)) {
        tx.insert(ledger)
          .values({ ...award, createdAt: sealedAt })
          .onConflictDoNothing()
          .run();
      }
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

/** Sealed days as records. Unsealed days (today, or not yet caught up) are left out. */
export function toDayRecords(
  dayRows: readonly DayLogRow[],
  orderRows: readonly OrderLogRow[],
  targets: OrderTargets,
): DayRecord[] {
  const orderRowsByDay = groupByDay(orderRows);
  return dayRows
    .filter((row) => row.sealedAt)
    .map((row) => ({
      day: row.day,
      result: getDayResult(toOrderAmounts(orderRowsByDay.get(row.day) ?? []), targets, row.truceUsed),
    }));
}
