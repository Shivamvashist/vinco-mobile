import { type CustomOrder, orderKindsIn, type OrderKind } from '@/features/orders';
import type { TodayOrders } from '@/hooks/useTodayOrders';

import { describeCustomOrderRow, describeOrderRow } from './describeOrderRow';
import type { OrderListRow } from './OrderList';

type Handlers = {
  onPress: (kind: OrderKind) => void;
  onLongPress: (kind: OrderKind) => void;
  onPressOwn: (order: CustomOrder, amount: number) => void;
  onLongPressOwn: (order: CustomOrder, amount: number) => void;
};

/** Today's rows: the arc's Vinco orders, then the user's own, each with its words and handlers. */
export function buildOrderRows(orders: TodayOrders, handlers: Handlers): OrderListRow[] {
  const vinco = orderKindsIn(orders.targets).map((kind) => ({
    key: kind,
    content: describeOrderRow(kind, orders),
    status: orders.statuses[kind],
    onPress: () => handlers.onPress(kind),
    onLongPress: () => handlers.onLongPress(kind),
  }));
  const own = orders.customOrders.map(({ order, amount, status }) => ({
    key: `own-${order.id}`,
    content: describeCustomOrderRow(order, amount, status),
    status,
    onPress: () => handlers.onPressOwn(order, amount),
    onLongPress: () => handlers.onLongPressOwn(order, amount),
  }));
  return [...vinco, ...own];
}
