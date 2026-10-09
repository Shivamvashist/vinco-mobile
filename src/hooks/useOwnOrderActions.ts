import { addCustomOrder, CustomOrderError, db, standDownCustomOrder } from '@/db';
import type { CustomOrderDraft, CustomOrderError as CustomOrderErrorReason } from '@/features/orders';

import { useToday } from './useToday';

export type OwnOrderActions = {
  /** Adds an own order counting from today. Returns null when saved, or why not. */
  add: (draft: CustomOrderDraft) => CustomOrderErrorReason | 'failed' | null;
  /** Stands an own order down: counts today, gone from tomorrow. Returns false if it failed. */
  standDown: (orderId: number) => boolean;
};

/** Adding and standing down the user's own orders, for Today and the orders screen. */
export function useOwnOrderActions(arcId: number | null): OwnOrderActions {
  const today = useToday();

  return {
    add: (draft) => {
      if (arcId == null) return 'failed';
      try {
        addCustomOrder(db, arcId, draft, today);
        return null;
      } catch (error) {
        if (error instanceof CustomOrderError) return error.reason;
        if (__DEV__) console.warn('[orders] Could not add an order.', error);
        return 'failed';
      }
    },
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
