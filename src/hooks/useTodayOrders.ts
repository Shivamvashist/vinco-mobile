import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import {
  type AppDatabase,
  db,
  getCustomOrderAmount,
  getDayLog,
  getDayStanding,
  getOrderLogsForDay,
  nowIso,
  saveCustomOrderAmount,
  saveOrderAmount,
  selectCustomOrderLogsBetween,
  selectCustomOrdersOn,
  selectDayLog,
  selectOrderLogsForDay,
  toCustomAmounts,
  toCustomOrder,
  toOrderAmounts,
  toWorkoutNote,
  updateDayLog,
} from '@/db';
import {
  addStep,
  clampAmount,
  countOrdersHeld,
  type CustomOrder,
  DEFAULT_ORDER_TARGETS,
  getCustomOrderStatus,
  getOrderStatus,
  getOrderStatuses,
  maxAmountFor,
  nextCustomAmount,
  ORDER_KINDS,
  type OrderAmounts,
  type OrderKind,
  type OrderStatus,
  type OrderTargets,
  previousCustomAmount,
  removeStep,
} from '@/features/orders';
import type { DayKey } from '@/lib/dates';

import { useToday } from './useToday';

/** Longest workout note kept. Notes are a few words, not a diary. */
export const WORKOUT_NOTE_MAX_LENGTH = 80;

/** Never matches a real arc: used to query no own orders until the arc is known. */
const NO_ARC_ID = -1;

/** One of the user's own orders on today. */
export type TodayCustomOrder = { order: CustomOrder; amount: number; status: OrderStatus };

export type TodayOrders = {
  today: DayKey;
  /** False until today's rows are read for the first time. Render rows only once loaded. */
  isLoaded: boolean;
  targets: OrderTargets;
  amounts: OrderAmounts;
  statuses: Record<OrderKind, OrderStatus>;
  /** The user's own orders that count today, oldest first. */
  customOrders: TodayCustomOrder[];
  /** Orders held today, Vinco's four and own orders together. */
  heldCount: number;
  /** Every order that counts today. */
  totalCount: number;
  wokeAt: Date | null;
  /** When the user went to sleep before today's wake-up, if logged. */
  sleptAt: Date | null;
  workoutNote: string;
  isStampVisible: boolean;
  /** True when the last change could not be saved. Cleared by the next successful save. */
  hasSaveError: boolean;
  /** Adds one step. Returns the order's new status so the caller can pick a sound. */
  addOne: (kind: OrderKind) => OrderStatus;
  /** Removes one step (long-press undo). Undoing wake-up clears both wake and sleep times. */
  undoOne: (kind: OrderKind) => OrderStatus;
  /** Logs wake-up with its times (from the wake sheet): wake-up held, sleep recorded. */
  logWakeUp: (wokeAt: Date, sleptAt: Date | null) => OrderStatus;
  /** Logs the workout at a number of minutes, with an optional note. */
  logWorkout: (minutes: number, note: string) => OrderStatus;
  /** Own order, one tap: up a level (minimum, then full goal). Returns the new status. */
  addOneCustom: (orderId: number) => OrderStatus;
  /** Own order, long press: down a level. Returns the new status. */
  undoOneCustom: (orderId: number) => OrderStatus;
  dismissStamp: () => void;
};

/** Day-log fields an order change may set alongside it. */
type DayPatch = { wokeAt?: string | null; sleptAt?: string | null };

type Change = {
  /** The order's next amount, from its current one. */
  nextAmount: (current: number) => number;
  note?: string;
  /** Extra fields for today's day log, from the order's amount before and after. */
  dayPatch?: (before: number, after: number) => DayPatch;
};

/**
 * Today's orders (Vinco's four and the user's own), saved on the phone as the user taps.
 * Reads with Drizzle live queries, so the screen updates whenever a row changes.
 * Each tap is one transaction that reads the fresh value first, so rapid taps never race.
 * @param arcId the active arc, whose own orders count; null for Vinco's four only
 */
export function useTodayOrders(
  targets: OrderTargets = DEFAULT_ORDER_TARGETS,
  arcId: number | null = null,
): TodayOrders {
  const today = useToday();
  const orderLogs = useLiveQuery(selectOrderLogsForDay(db, today), [today]);
  const dayLog = useLiveQuery(selectDayLog(db, today), [today]);
  const customRows = useLiveQuery(selectCustomOrdersOn(db, arcId ?? NO_ARC_ID, today), [arcId, today]);
  const customLogs = useLiveQuery(selectCustomOrderLogsBetween(db, today, today), [today]);
  // The overlay is UI state; whether the stamp was already shown lives in the day log.
  const [stampVisibleDay, setStampVisibleDay] = useState<DayKey | null>(null);
  const [hasSaveError, setHasSaveError] = useState(false);

  const amounts = toOrderAmounts(orderLogs.data);
  const customAmounts = toCustomAmounts(customLogs.data, today);
  const customOrders: TodayCustomOrder[] = customRows.data.map((row) => {
    const order = toCustomOrder(row);
    const amount = customAmounts.get(order.id) ?? 0;
    return { order, amount, status: getCustomOrderStatus(amount, order) };
  });
  const customHeld = customOrders.filter((item) => item.status !== 'none').length;
  const wokeAtIso = dayLog.data[0]?.wokeAt ?? null;
  const wokeAt = wokeAtIso ? new Date(wokeAtIso) : null;
  const sleptAtIso = dayLog.data[0]?.sleptAt ?? null;
  const sleptAt = sleptAtIso ? new Date(sleptAtIso) : null;

  /**
   * Runs one change in a transaction, then lands the stamp if every order now holds
   * (once per day). The save returns the order's new status; on failure, the old one.
   */
  const runChange = (
    label: string,
    fallback: OrderStatus,
    save: (tx: AppDatabase) => { status: OrderStatus; dayPatch?: DayPatch },
  ): OrderStatus => {
    try {
      const result = db.transaction((tx) => {
        const saved = save(tx);
        const shouldStamp =
          !getDayLog(tx, today)?.stampedAt && getDayStanding(tx, arcId, today, targets) !== 'missed';
        updateDayLog(tx, today, {
          ...saved.dayPatch,
          ...(shouldStamp ? { stampedAt: nowIso() } : {}),
        });
        return { status: saved.status, shouldStamp };
      });
      setHasSaveError(false);
      if (result.shouldStamp) setStampVisibleDay(today);
      return result.status;
    } catch (error) {
      if (__DEV__) console.warn(`[orders] Could not save ${label}.`, error);
      setHasSaveError(true);
      return fallback;
    }
  };

  const applyChange = (kind: OrderKind, change: Change): OrderStatus =>
    runChange(kind, getOrderStatus(amounts[kind], targets[kind]), (tx) => {
      const before = toOrderAmounts(getOrderLogsForDay(tx, today));
      const amount = clampAmount(
        change.nextAmount(before[kind]),
        targets[kind],
        maxAmountFor(kind, targets[kind]),
      );
      saveOrderAmount(tx, today, kind, amount, { note: change.note });
      return {
        status: getOrderStatus(amount, targets[kind]),
        dayPatch: change.dayPatch?.(before[kind], amount),
      };
    });

  const applyCustomChange = (orderId: number, next: (amount: number, order: CustomOrder) => number) => {
    const item = customOrders.find((candidate) => candidate.order.id === orderId);
    if (!item) return 'none';
    return runChange(`own order ${orderId}`, item.status, (tx) => {
      const amount = next(getCustomOrderAmount(tx, orderId, today), item.order);
      saveCustomOrderAmount(tx, orderId, today, amount);
      return { status: getCustomOrderStatus(amount, item.order) };
    });
  };

  return {
    today,
    isLoaded:
      orderLogs.updatedAt !== undefined &&
      dayLog.updatedAt !== undefined &&
      customRows.updatedAt !== undefined &&
      customLogs.updatedAt !== undefined,
    targets,
    amounts,
    statuses: getOrderStatuses(amounts, targets),
    customOrders,
    heldCount: countOrdersHeld(amounts, targets) + customHeld,
    totalCount: ORDER_KINDS.length + customOrders.length,
    wokeAt: wokeAt && !Number.isNaN(wokeAt.getTime()) ? wokeAt : null,
    sleptAt: sleptAt && !Number.isNaN(sleptAt.getTime()) ? sleptAt : null,
    workoutNote: toWorkoutNote(orderLogs.data),
    isStampVisible: stampVisibleDay === today,
    hasSaveError,
    addOne: (kind) =>
      applyChange(kind, {
        nextAmount: (current) => addStep(current, targets[kind], maxAmountFor(kind, targets[kind])),
        dayPatch: (before, after) =>
          kind === 'wake' && before === 0 && after > 0 ? { wokeAt: nowIso() } : {},
      }),
    undoOne: (kind) =>
      applyChange(kind, {
        nextAmount: (current) => removeStep(current, targets[kind], maxAmountFor(kind, targets[kind])),
        note: kind === 'workout' ? '' : undefined,
        dayPatch: (_before, after) => (kind === 'wake' && after === 0 ? { wokeAt: null, sleptAt: null } : {}),
      }),
    logWorkout: (minutes, note) =>
      applyChange('workout', {
        nextAmount: () => minutes,
        note: note.trim().slice(0, WORKOUT_NOTE_MAX_LENGTH),
      }),
    logWakeUp: (wokeAtTime, sleptAtTime) =>
      applyChange('wake', {
        nextAmount: () => targets.wake.full,
        dayPatch: () => ({
          wokeAt: nowIso(wokeAtTime),
          sleptAt: sleptAtTime ? nowIso(sleptAtTime) : null,
        }),
      }),
    addOneCustom: (orderId) => applyCustomChange(orderId, nextCustomAmount),
    undoOneCustom: (orderId) => applyCustomChange(orderId, previousCustomAmount),
    dismissStamp: () => setStampVisibleDay(null),
  };
}
