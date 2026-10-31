import {
  type CustomOrder,
  customOrderMode,
  maxAmountFor,
  orderKindsIn,
  type OrderKind,
  targetFor,
} from '@/features/orders';
import type { TodayOrders } from '@/hooks/useTodayOrders';

import { describeCustomOrderRow, describeOrderRow } from './describeOrderRow';
import type { OrderListRow } from './OrderList';
import type { RowControls } from './TaskRow';

type Handlers = {
  onPress: (kind: OrderKind) => void;
  onLongPress: (kind: OrderKind) => void;
  onPressOwn: (order: CustomOrder, amount: number) => void;
  onLongPressOwn: (order: CustomOrder, amount: number) => void;
};

/** Vinco's orders counted in levels (a tap adds a step). Wake-up and workout open a sheet. */
const STEPPED_KINDS: ReadonlySet<OrderKind> = new Set(['water', 'meal']);

/** Minus and plus for an order with levels, from its amount and its cap. */
function stepper(amount: number, max: number): RowControls {
  return { type: 'stepper', canAdd: amount < max, canRemove: amount > 0 };
}

/** Today's rows: the arc's Vinco orders, then the user's own, each with its words and handlers. */
export function buildOrderRows(orders: TodayOrders, handlers: Handlers): OrderListRow[] {
  const vinco = orderKindsIn(orders.targets).map((kind): OrderListRow => {
    const content = describeOrderRow(kind, orders);
    const max = maxAmountFor(kind, targetFor(orders.targets, kind));
    return {
      key: kind,
      content,
      status: orders.statuses[kind],
      controls: STEPPED_KINDS.has(kind) ? stepper(orders.amounts[kind], max) : undefined,
      onPress: () => handlers.onPress(kind),
      onLongPress: () => handlers.onLongPress(kind),
    };
  });
  const own = orders.customOrders.map(({ order, amount, status }): OrderListRow => {
    const content = describeCustomOrderRow(order, amount, status);
    const mode = customOrderMode(order);
    // Done or not (or a goal of one): the check toggles, and so does a tap on the row.
    if (mode === 'check' || (mode === 'tap' && order.full === 1)) {
      const isDone = status === 'full';
      const toggle = () =>
        isDone ? handlers.onLongPressOwn(order, amount) : handlers.onPressOwn(order, amount);
      return {
        key: `own-${order.id}`,
        content,
        status,
        controls: { type: 'check' },
        onPress: toggle,
        onLongPress: () => handlers.onLongPressOwn(order, amount),
      };
    }
    return {
      key: `own-${order.id}`,
      content,
      status,
      controls: mode === 'tap' ? stepper(amount, order.full) : undefined,
      onPress: () => handlers.onPressOwn(order, amount),
      onLongPress: () => handlers.onLongPressOwn(order, amount),
    };
  });
  return [...vinco, ...own];
}
