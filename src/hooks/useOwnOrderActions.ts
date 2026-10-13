import {
  addArcOrder,
  addCustomOrder,
  convertTaskToOrder,
  CustomOrderError,
  db,
  removeArcOrder,
  standDownCustomOrder,
} from '@/db';
import type {
  CustomOrderDraft,
  CustomOrderError as CustomOrderErrorReason,
  OrderKind,
} from '@/features/orders';

import { useToday } from './useToday';

export type OwnOrderActions = {
  /** Adds an own order counting from today. Returns null when saved, or why not. */
  add: (draft: CustomOrderDraft) => CustomOrderErrorReason | 'failed' | null;
  /** Turns a task into an own order (the task goes). Returns null when saved, or why not. */
  convertTask: (taskId: number, draft: CustomOrderDraft) => CustomOrderErrorReason | 'failed' | null;
  /** Stands an own order down: counts today, gone from tomorrow. Returns false if it failed. */
  standDown: (orderId: number) => boolean;
  /** Free training: adds one of Vinco's orders (a suggestion). Returns false if it failed. */
  addVinco: (kind: OrderKind) => boolean;
  /** Free training: removes one of Vinco's orders from today on. Returns false if it failed. */
  removeVinco: (kind: OrderKind) => boolean;
};

/** Adding and removing orders (the user's own, and Vinco's in free training), for Today and the plan. */
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
