import { commonCopy, todayCopy } from '@/copy';
import type { OrderKind } from '@/features/orders';
import { sleepMinutesFromMoments } from '@/features/sleep';
import type { TodayOrders } from '@/hooks/useTodayOrders';
import { formatClockTime } from '@/lib/dates';

export type OrderRowContent = {
  name: string;
  line: string;
  action: string;
  hint: string;
  segments?: { total: number; filled: number };
};

/** The words and bar for one order row on Today, from today's state. */
export function describeOrderRow(kind: OrderKind, orders: TodayOrders): OrderRowContent {
  const amount = orders.amounts[kind];
  const target = orders.targets[kind];
  const status = orders.statuses[kind];

  switch (kind) {
    case 'water': {
      const copy = todayCopy.orders.water;
      const total = Math.max(1, Math.ceil(target.full / target.step));
      const filled = status === 'full' ? total : Math.floor(amount / target.step);
      return {
        name: copy.name,
        line: copy.line(amount, target.full, status),
        action: copy.action,
        hint: copy.hint,
        segments: { total, filled },
      };
    }
    case 'wake': {
      const copy = todayCopy.orders.wake;
      const sleep = sleepMinutesFromMoments(
        orders.sleptAt?.toISOString() ?? null,
        orders.wokeAt?.toISOString() ?? null,
      );
      const line = orders.wokeAt
        ? copy.doneLine(formatClockTime(orders.wokeAt), sleep != null ? commonCopy.duration(sleep) : null)
        : copy.idleLine;
      return { name: copy.name, line, action: copy.action, hint: copy.hint };
    }
    case 'meal': {
      const copy = todayCopy.orders.meal;
      return {
        name: copy.name,
        line: copy.line(amount, target.full, status),
        action: copy.action,
        hint: copy.hint,
      };
    }
    case 'workout': {
      const copy = todayCopy.orders.workout;
      const line =
        status === 'none' ? copy.idleLine(target.full) : copy.doneLine(amount, status, orders.workoutNote);
      return { name: copy.name, line, action: copy.action, hint: copy.hint };
    }
  }
}
