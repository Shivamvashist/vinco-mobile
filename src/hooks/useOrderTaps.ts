import {
  type CustomOrder,
  isTapCounted,
  maxAmountFor,
  type OrderKind,
  type OrderStatus,
  targetFor,
} from '@/features/orders';
import { useFeedback } from '@/theme';

import type { TodayOrders } from './useTodayOrders';

export type OrderTaps = {
  onPress: (kind: OrderKind) => void;
  onLongPress: (kind: OrderKind) => void;
  onPressOwn: (order: CustomOrder, amount: number) => void;
  onLongPressOwn: (order: CustomOrder, amount: number) => void;
  /** The sound for a new status: the win at the full goal, a tap otherwise. */
  playForStatus: (status: OrderStatus) => void;
};

type Openers = {
  /** Wake-up and workout are logged in a sheet. */
  openSheet: (sheet: 'wake' | 'workout') => void;
  /** Own orders with big goals (steps) are typed in. */
  openAmount: (order: CustomOrder, amount: number) => void;
};

/**
 * What a tap, a long press, the plus and the minus do on Today's order rows, with their sounds.
 * Taps past the cap or below zero are refused with the "denied" cue.
 */
export function useOrderTaps(orders: TodayOrders, { openSheet, openAmount }: Openers): OrderTaps {
  const play = useFeedback();
  const { targets } = orders;

  const playForStatus = (status: OrderStatus) => play(status === 'full' ? 'win' : 'tap');

  return {
    playForStatus,
    onPress: (kind) => {
      if (kind === 'wake') {
        play('tap');
        openSheet('wake');
        return;
      }
      // The full goal isn't a ceiling: only the cap stops more being logged.
      if (orders.amounts[kind] >= maxAmountFor(kind, targetFor(targets, kind))) {
        play('denied');
        return;
      }
      if (kind === 'workout') {
        play('tap');
        openSheet('workout');
        return;
      }
      playForStatus(orders.addOne(kind));
    },
    onLongPress: (kind) => {
      if (orders.amounts[kind] <= 0) {
        play('denied');
        return;
      }
      play('stepDown');
      orders.undoOne(kind);
    },
    // Small counts (glasses) go up one per tap; big ones (steps) are typed in.
    onPressOwn: (order, amount) => {
      if (!isTapCounted(order)) {
        play('tap');
        openAmount(order, amount);
        return;
      }
      if (amount >= order.full) {
        play('denied');
        return;
      }
      playForStatus(orders.addOneCustom(order.id));
    },
    onLongPressOwn: (order, amount) => {
      if (!isTapCounted(order)) {
        openAmount(order, amount);
        return;
      }
      if (amount <= 0) {
        play('denied');
        return;
      }
      play('stepDown');
      orders.undoOneCustom(order.id);
    },
  };
}
