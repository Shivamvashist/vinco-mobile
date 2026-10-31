import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import {
  db,
  selectCustomOrderLogsBetween,
  selectCustomOrdersOn,
  selectOrderLogsBetween,
  toCustomAmounts,
  toCustomOrder,
} from '@/db';
import { arcEndDay } from '@/features/arc';
import { orderBars, type WeekBar, weekDays } from '@/features/logs';
import {
  isCheckOrder,
  type OrderKind,
  orderKindsIn,
  type OrderTarget,
  type OrderTargets,
  targetFor,
} from '@/features/orders';
import { addDays, type DayKey } from '@/lib/dates';
import { orderChartKey } from '@/stores';

/** Vinco's orders that have an amount to chart (wake-up is a time: it lives in the sleep chart). */
const CHARTED_KINDS: readonly OrderKind[] = ['water', 'meal', 'workout'];

export type OrderChart = {
  /** For hiddenOrderCharts (orderChartKey). */
  key: string;
  /** A Vinco order's kind, or null for the user's own (its name is in `name`). */
  kind: OrderKind | null;
  /** The user's own order's name; empty for Vinco's. */
  name: string;
  unit: string;
  /** Done or not: drawn as a week of ticks, not bars. */
  isCheck: boolean;
  target: OrderTarget;
  bars: WeekBar[];
};

type ArcInfo = { id: number; startDay: DayKey; lengthDays: number };

/**
 * One week of every order that counts today, as chart data: Vinco's (water, meal, workout) and
 * the user's own. Past arc days with nothing logged count as 0; days to come stay empty.
 */
export function useOrderCharts(
  arc: ArcInfo,
  targets: OrderTargets,
  weekStart: DayKey,
  today: DayKey,
): { charts: OrderChart[]; isLoaded: boolean } {
  const weekEnd = addDays(weekStart, 6);
  const orderRows = useLiveQuery(selectOrderLogsBetween(db, weekStart, weekEnd), [weekStart, weekEnd]);
  const customRows = useLiveQuery(selectCustomOrdersOn(db, arc.id, today), [arc.id, today]);
  const customLogs = useLiveQuery(selectCustomOrderLogsBetween(db, weekStart, weekEnd), [weekStart, weekEnd]);

  const days = weekDays(weekStart);
  const lastDay = arcEndDay(arc.startDay, arc.lengthDays);
  const counted = (day: DayKey, from: DayKey) =>
    day >= from && day >= arc.startDay && day <= today && day <= lastDay;

  const vinco = CHARTED_KINDS.filter((kind) => orderKindsIn(targets).includes(kind)).map(
    (kind): OrderChart => {
      const byDay = new Map<DayKey, number>();
      for (const day of days) if (counted(day, arc.startDay)) byDay.set(day, 0);
      for (const row of orderRows.data) {
        if (row.kind === kind && byDay.has(row.day) && Number.isFinite(row.amount))
          byDay.set(row.day, row.amount);
      }
      const target = targetFor(targets, kind);
      return {
        key: orderChartKey(kind),
        kind,
        name: '',
        unit: '',
        isCheck: false,
        target,
        bars: orderBars(days, byDay, target),
      };
    },
  );

  const own = customRows.data.map((row): OrderChart => {
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
      kind: null,
      name: order.name,
      unit: order.unit,
      isCheck: isCheckOrder(order) || order.full === 1,
      target,
      bars: orderBars(days, byDay, target),
    };
  });

  return {
    charts: [...vinco, ...own],
    isLoaded:
      orderRows.updatedAt !== undefined &&
      customRows.updatedAt !== undefined &&
      customLogs.updatedAt !== undefined,
  };
}
