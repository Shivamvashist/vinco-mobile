import {
  addArcOrder,
  addCustomOrder,
  convertTaskToOrder,
  CustomOrderError,
  db,
  editCustomOrder,
  type OrderEditStart,
  removeArcOrder,
  setArcOrderFull,
  setArcWakeTime,
  standDownCustomOrder,
} from '@/db';
import type {
  CustomOrderDraft,
  CustomOrderError as CustomOrderErrorReason,
  OrderKind,
  TunableOrder,
} from '@/features/orders';
import { toClockString } from '@/lib/dates';

import { useToday } from './useToday';

export type OwnOrderActions = {
  /** Adds an own order counting from today. Returns null when saved, or why not. */
  add: (draft: CustomOrderDraft) => CustomOrderErrorReason | 'failed' | null;
  /** Turns a task into an own order (the task goes). Returns null when saved, or why not. */
  convertTask: (taskId: number, draft: CustomOrderDraft) => CustomOrderErrorReason | 'failed' | null;
  /**
   * Edits an own order. Returns when the change counts from ('today', or 'tomorrow' for a lower
   * goal), or why it was refused.
   */
  edit: (
    orderId: number,
    draft: CustomOrderDraft,
  ) => { start: OrderEditStart } | { error: CustomOrderErrorReason | 'failed' };
  /** Changes the full goal of one of Vinco's orders, from today. Returns false if it failed. */
  setVincoFull: (kind: TunableOrder, full: number) => boolean;
  /** Changes the planned wake-up time (minutes after midnight). Returns false if it failed. */
  setWakeTime: (minutes: number) => boolean;
  /** Stands an own order down: counts today, gone from tomorrow. Returns false if it failed. */
  standDown: (orderId: number) => boolean;
  /** Free training: adds one of Vinco's orders (a suggestion). Returns false if it failed. */
  addVinco: (kind: OrderKind) => boolean;
  /** Free training: removes one of Vinco's orders from today on. Returns false if it failed. */
  removeVinco: (kind: OrderKind) => boolean;
};

/** Adding, editing and removing orders (the user's own, and Vinco's), for Today and the plan. */
export function useOwnOrderActions(arcId: number | null): OwnOrderActions {
  const today = useToday();

  const save = (write: (arc: number) => void) => {
    if (arcId == null) return 'failed';
    try {
      write(arcId);
      return null;
    } catch (error) {
      if (error instanceof CustomOrderError) return error.reason;
      if (__DEV__) console.warn('[orders] Could not save the order.', error);
      return 'failed';
    }
  };

  return {
    add: (draft) => save((arc) => addCustomOrder(db, arc, draft, today)),
    convertTask: (taskId, draft) => save((arc) => convertTaskToOrder(db, taskId, arc, draft, today)),
    edit: (orderId, draft) => {
      try {
        return { start: editCustomOrder(db, orderId, draft, today) };
      } catch (error) {
        if (error instanceof CustomOrderError) return { error: error.reason };
        if (__DEV__) console.warn('[orders] Could not edit the order.', error);
        return { error: 'failed' };
      }
    },
    setVincoFull: (kind, full) =>
      arcId != null && attempt('change a goal', () => setArcOrderFull(db, arcId, kind, full)),
    setWakeTime: (minutes) =>
      arcId != null &&
      attempt('change the wake time', () => setArcWakeTime(db, arcId, toClockString(minutes))),
    standDown: (orderId) => attempt('stand an order down', () => standDownCustomOrder(db, orderId, today)),
    addVinco: (kind) => attempt('add an order', () => arcId != null && addArcOrder(db, arcId, kind)),
    removeVinco: (kind) => attempt('remove an order', () => arcId != null && removeArcOrder(db, arcId, kind)),
  };
}

/** Runs a write; false (and a dev warning) if it threw. */
function attempt(label: string, write: () => unknown): boolean {
  try {
    write();
    return true;
  } catch (error) {
    if (__DEV__) console.warn(`[orders] Could not ${label}.`, error);
    return false;
  }
}
