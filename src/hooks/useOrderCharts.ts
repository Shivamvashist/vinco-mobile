import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectCustomOrderLogsBetween, selectCustomOrdersOn, toCustomAmounts, toCustomOrder } from '@/db';
import { arcEndDay } from '@/features/arc';
import { orderBars, type WeekBar, weekDays } from '@/features/logs';
import { isCheckOrder, type OrderTarget } from '@/features/orders';
import { addDays, type DayKey } from '@/lib/dates';
import { orderChartKey } from '@/stores';

export type OrderChart = {
  /** For hiddenOrderCharts (orderChartKey). */
  key: string;
  /** The order's name, as the user wrote it. */
  name: string;
  unit: string;
  /** Done or not: drawn as a week of ticks, not bars. */
  isCheck: boolean;
  target: OrderTarget;
  bars: WeekBar[];
};

type ArcInfo = { id: number; startDay: DayKey; lengthDays: number };

/**
 * One week of each of the user's own orders that count today, as chart data. Vinco's orders
 * (water, wake-up, meal, workout) never get one here: they have their own logs (sleep, water,
 * workout). Past arc days with nothing logged count as 0; days to come stay empty.
 */
export function useOrderCharts(
  arc: ArcInfo,
  weekStart: DayKey,
  today: DayKey,
): { charts: OrderChart[]; isLoaded: boolean } {
  const weekEnd = addDays(weekStart, 6);
  const customRows = useLiveQuery(selectCustomOrdersOn(db, arc.id, today), [arc.id, today]);
  const customLogs = useLiveQuery(selectCustomOrderLogsBetween(db, weekStart, weekEnd), [weekStart, weekEnd]);

  const days = weekDays(weekStart);
  const lastDay = arcEndDay(arc.startDay, arc.lengthDays);
  const counted = (day: DayKey, from: DayKey) =>
    day >= from && day >= arc.startDay && day <= today && day <= lastDay;

  const charts = customRows.data.map((row): OrderChart => {
    const order = toCustomOrder(row);
    const byDay = new Map<DayKey, number>();
    for (const day of days) {
      // An order added mid-week has nothing to show before its first day.
      if (counted(day, order.firstDay))
        byDay.set(day, toCustomAmounts(customLogs.data, day).get(order.id) ?? 0);
    }
    const target: OrderTarget = { min: order.min, full: order.full, step: 1 };
    return {
      key: orderChartKey(order),
      name: order.name,
      unit: order.unit,
      isCheck: isCheckOrder(order) || order.full === 1,
      target,
      bars: orderBars(days, byDay, target),
    };
  });

  return {
    charts,
    isLoaded: customRows.updatedAt !== undefined && customLogs.updatedAt !== undefined,
  };
}
