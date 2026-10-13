import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import {
  db,
  selectCustomOrderLogsBetween,
  selectCustomOrdersOn,
  selectDayLog,
  selectOrderLogsForDay,
  selectTaskCompletionsBetween,
  toCustomAmounts,
  toCustomOrder,
  toOrderAmounts,
  toWorkoutNote,
} from '@/db';
import {
  getCustomOrderStatus,
  getOrderStatus,
  orderKindsIn,
  type OrderKind,
  type OrderStatus,
  type OrderTargets,
} from '@/features/orders';
import { sleepMinutesFromMoments } from '@/features/sleep';
import type { DayKey } from '@/lib/dates';

/** Never matches a real arc. */
const NO_ARC_ID = -1;

export type DaySummaryOrder = {
  key: string;
  /** A Vinco order's kind, or null for the user's own. */
  kind: OrderKind | null;
  name: string;
  amount: number;
  full: number;
  unit: string;
  status: OrderStatus;
};

export type DaySummary = {
  orders: DaySummaryOrder[];
  wokeAt: Date | null;
  sleepMinutes: number | null;
  weightKg: number | null;
  calories: number | null;
  selfiePath: string | null;
  workoutNote: string;
  tasksDone: number;
  isLoaded: boolean;
};

/**
 * Everything logged on one day, for the calendar's day sheet: each order against its goal (the
 * arc's current goals), wake and sleep, weight, calories, the selfie and to-dos ticked.
 */
export function useDaySummary(
  day: DayKey,
  arcId: number | null,
  targets: OrderTargets,
  names: Record<OrderKind, string>,
): DaySummary {
  const dayLog = useLiveQuery(selectDayLog(db, day), [day]);
  const orderLogs = useLiveQuery(selectOrderLogsForDay(db, day), [day]);
  const ownRows = useLiveQuery(selectCustomOrdersOn(db, arcId ?? NO_ARC_ID, day), [arcId, day]);
  const ownLogs = useLiveQuery(selectCustomOrderLogsBetween(db, day, day), [day]);
  const ticks = useLiveQuery(selectTaskCompletionsBetween(db, day, day), [day]);

  const amounts = toOrderAmounts(orderLogs.data);
  const ownAmounts = toCustomAmounts(ownLogs.data, day);
  const log = dayLog.data[0];
  const wokeAt = log?.wokeAt ? new Date(log.wokeAt) : null;

  const vinco: DaySummaryOrder[] = orderKindsIn(targets).map((kind) => {
    const target = targets[kind] ?? { min: 1, full: 1, step: 1 };
    return {
      key: kind,
      kind,
      name: names[kind],
      amount: amounts[kind],
      full: target.full,
      unit: '',
      status: getOrderStatus(amounts[kind], target),
    };
  });
  const own: DaySummaryOrder[] = ownRows.data.map((row) => {
    const order = toCustomOrder(row);
    const amount = ownAmounts.get(order.id) ?? 0;
    return {
      key: `own-${order.id}`,
      kind: null,
      name: order.name,
      amount,
      full: order.full,
      unit: order.unit,
      status: getCustomOrderStatus(amount, order),
    };
  });

  return {
    orders: [...vinco, ...own],
    wokeAt: wokeAt && !Number.isNaN(wokeAt.getTime()) ? wokeAt : null,
    sleepMinutes: sleepMinutesFromMoments(log?.sleptAt ?? null, log?.wokeAt ?? null),
    weightKg: log?.weightKg ?? null,
    calories: log?.calories ?? null,
    selfiePath: log?.selfiePath ?? null,
    workoutNote: toWorkoutNote(orderLogs.data),
    tasksDone: ticks.data.length,
    isLoaded:
      dayLog.updatedAt !== undefined &&
      orderLogs.updatedAt !== undefined &&
      ownRows.updatedAt !== undefined &&
      ownLogs.updatedAt !== undefined &&
      ticks.updatedAt !== undefined,
  };
}
