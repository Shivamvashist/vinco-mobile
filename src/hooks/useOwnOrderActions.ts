import { addCustomOrder, convertTaskToOrder, CustomOrderError, db, standDownCustomOrder } from '@/db';
import type { CustomOrderDraft, CustomOrderError as CustomOrderErrorReason } from '@/features/orders';

import { useToday } from './useToday';

export type OwnOrderActions = {
  /** Adds an own order counting from today. Returns null when saved, or why not. */
  add: (draft: CustomOrderDraft) => CustomOrderErrorReason | 'failed' | null;
  /** Turns a task into an own order (the task goes). Returns null when saved, or why not. */
  convertTask: (taskId: number, draft: CustomOrderDraft) => CustomOrderErrorReason | 'failed' | null;
  /** Stands an own order down: counts today, gone from tomorrow. Returns false if it failed. */
  standDown: (orderId: number) => boolean;
};

/** Adding and standing down the user's own orders, for Today and the orders screen. */
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
    standDown: (orderId) => {
      try {
        standDownCustomOrder(db, orderId, today);
        return true;
      } catch (error) {
        if (__DEV__) console.warn('[orders] Could not stand an order down.', error);
        return false;
      }
    },
  };
}
