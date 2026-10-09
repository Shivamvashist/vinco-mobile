import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import {
  db,
  getDayLog,
  getOrderLogsForDay,
  nowIso,
  saveOrderAmount,
  selectDayLog,
  selectOrderLogsForDay,
  toOrderAmounts,
  toWorkoutNote,
  updateDayLog,
} from '@/db';
import {
  addStep,
  areAllOrdersHeld,
  clampAmount,
  countOrdersHeld,
  DEFAULT_ORDER_TARGETS,
  getOrderStatus,
  getOrderStatuses,
  type OrderAmounts,
  type OrderKind,
  type OrderStatus,
  type OrderTargets,
  removeStep,
} from '@/features/orders';
import type { DayKey } from '@/lib/dates';

import { useToday } from './useToday';

/** Longest workout note kept. Notes are a few words, not a diary. */
export const WORKOUT_NOTE_MAX_LENGTH = 80;

export type TodayOrders = {
  today: DayKey;
  /** False until today's rows are read for the first time. Render rows only once loaded. */
  isLoaded: boolean;
  targets: OrderTargets;
  amounts: OrderAmounts;
  statuses: Record<OrderKind, OrderStatus>;
  heldCount: number;
  wokeAt: Date | null;
  workoutNote: string;
  isStampVisible: boolean;
  /** True when the last change could not be saved. Cleared by the next successful save. */
  hasSaveError: boolean;
  /** Adds one step. Returns the order's new status so the caller can pick a sound. */
  addOne: (kind: OrderKind) => OrderStatus;
  /** Removes one step (long-press undo). Returns the new status. */
  undoOne: (kind: OrderKind) => OrderStatus;
  /** Logs the workout at a number of minutes, with an optional note. */
  logWorkout: (minutes: number, note: string) => OrderStatus;
  dismissStamp: () => void;
};

type Change = {
  /** The order's next amount, from its current one. */
  nextAmount: (current: number) => number;
  note?: string;
  /** Extra fields for today's day log, from the order's amount before and after. */
  dayPatch?: (before: number, after: number) => { wokeAt?: string | null };
};

/**
 * Today's four orders, saved on the phone as the user taps.
 * Reads with Drizzle live queries, so the screen updates whenever a row changes.
 * Each tap is one transaction that reads the fresh value first, so rapid taps never race.
 */
export function useTodayOrders(targets: OrderTargets = DEFAULT_ORDER_TARGETS): TodayOrders {
  const today = useToday();
  const orderLogs = useLiveQuery(selectOrderLogsForDay(db, today), [today]);
  const dayLog = useLiveQuery(selectDayLog(db, today), [today]);
  // The overlay is UI state; whether the stamp was already shown lives in the day log.
  const [stampVisibleDay, setStampVisibleDay] = useState<DayKey | null>(null);
  const [hasSaveError, setHasSaveError] = useState(false);

  const amounts = toOrderAmounts(orderLogs.data);
  const wokeAtIso = dayLog.data[0]?.wokeAt ?? null;
  const wokeAt = wokeAtIso ? new Date(wokeAtIso) : null;

  const applyChange = (kind: OrderKind, change: Change): OrderStatus => {
    try {
      const result = db.transaction((tx) => {
        const before = toOrderAmounts(getOrderLogsForDay(tx, today));
        const amount = clampAmount(change.nextAmount(before[kind]), targets[kind]);
        saveOrderAmount(tx, today, kind, amount, { note: change.note });

        const after = { ...before, [kind]: amount };
        const shouldStamp = !getDayLog(tx, today)?.stampedAt && areAllOrdersHeld(after, targets);
        updateDayLog(tx, today, {
          ...change.dayPatch?.(before[kind], amount),
          ...(shouldStamp ? { stampedAt: nowIso() } : {}),
        });
        return { status: getOrderStatus(amount, targets[kind]), shouldStamp };
      });
      setHasSaveError(false);
      if (result.shouldStamp) setStampVisibleDay(today);
      return result.status;
    } catch (error) {
      if (__DEV__) console.warn(`[orders] Could not save ${kind}.`, error);
      setHasSaveError(true);
      return getOrderStatus(amounts[kind], targets[kind]);
    }
  };

  return {
    today,
    isLoaded: orderLogs.updatedAt !== undefined && dayLog.updatedAt !== undefined,
    targets,
    amounts,
    statuses: getOrderStatuses(amounts, targets),
    heldCount: countOrdersHeld(amounts, targets),
    wokeAt: wokeAt && !Number.isNaN(wokeAt.getTime()) ? wokeAt : null,
    workoutNote: toWorkoutNote(orderLogs.data),
    isStampVisible: stampVisibleDay === today,
    hasSaveError,
    addOne: (kind) =>
      applyChange(kind, {
        nextAmount: (current) => addStep(current, targets[kind]),
        dayPatch: (before, after) =>
          kind === 'wake' && before === 0 && after > 0 ? { wokeAt: nowIso() } : {},
      }),
    undoOne: (kind) =>
      applyChange(kind, {
        nextAmount: (current) => removeStep(current, targets[kind]),
        note: kind === 'workout' ? '' : undefined,
        dayPatch: (_before, after) => (kind === 'wake' && after === 0 ? { wokeAt: null } : {}),
      }),
    logWorkout: (minutes, note) =>
      applyChange('workout', {
        nextAmount: () => minutes,
        note: note.trim().slice(0, WORKOUT_NOTE_MAX_LENGTH),
      }),
    dismissStamp: () => setStampVisibleDay(null),
  };
}
