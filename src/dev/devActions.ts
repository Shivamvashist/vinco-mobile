/**
 * DEV ONLY: shortcuts for testing on a phone, used by the dev panel in Vici.
 * They write through the normal repository functions, so the app sees ordinary records.
 */
import { type AppDatabase, getDayLog, nowIso, saveOrderAmount, updateDayLog } from '@/db';
import { ORDER_KINDS, type OrderTargets } from '@/features/orders';
import type { DayKey } from '@/lib/dates';

/**
 * Sets every order on a day to its minimum (hold) or full goal (conquer), in one transaction.
 * Marks the stamp as shown, so it doesn't land on the next unrelated tap.
 */
export function fillDayOrders(
  db: AppDatabase,
  day: DayKey,
  targets: OrderTargets,
  level: 'hold' | 'conquer',
): void {
  db.transaction((tx) => {
    for (const kind of ORDER_KINDS) {
      const target = targets[kind];
      saveOrderAmount(tx, day, kind, level === 'conquer' ? target.full : target.min);
    }
    const log = getDayLog(tx, day);
    const now = nowIso();
    updateDayLog(tx, day, { wokeAt: log?.wokeAt ?? now, stampedAt: log?.stampedAt ?? now });
  });
}
