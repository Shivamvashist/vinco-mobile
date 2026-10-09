import { type DayResult, getDayResult } from '@/features/campaign';
import { getCustomOrderStatus, type OrderTargets } from '@/features/orders';
import type { DayKey } from '@/lib/dates';

import { getCustomOrdersWithAmounts } from './customOrders';
import type { AppDatabase } from './database';
import { getOrderLogsForDay, toOrderAmounts } from './orderLogs';

/**
 * Where a day stands right now, from Vinco's four orders and every own order active that day.
 * The one place that decides "held": used by the stamp and by sealing.
 * @param arcId the arc whose own orders count, or null for Vinco's four only
 */
export function getDayStanding(
  db: AppDatabase,
  arcId: number | null,
  day: DayKey,
  targets: OrderTargets,
): Exclude<DayResult, 'truce'> {
  const amounts = toOrderAmounts(getOrderLogsForDay(db, day));
  const custom = arcId == null ? [] : getCustomOrdersWithAmounts(db, arcId, day);
  const result = getDayResult(
    amounts,
    targets,
    false,
    custom.map(({ order, amount }) => getCustomOrderStatus(amount, order)),
  );
  return result === 'truce' ? 'missed' : result;
}
