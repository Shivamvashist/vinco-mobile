import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { useTabReturn } from '@/hooks/useTabReturn';
import { createStyles } from '@/theme';

import { SegmentedControl } from '../SegmentedControl';
import { OrderList, type OrderListRow } from './OrderList';
import { TodayTasks, type TodayTasksProps } from './TodayTasks';

export type TodaySectionProps = {
  rows: readonly OrderListRow[];
  /** Before wake-up: the order rows show dimmed and can't be tapped. */
  isWaiting: boolean;
  /** Under the order rows: "Add an order", or the suggestion when there are none. */
  ordersFooter?: ReactNode;
  tasks: TodayTasksProps;
};

type Side = 'orders' | 'tasks';

const OPTIONS = [
  { value: 'orders', label: todayCopy.section.orders },
  { value: 'tasks', label: todayCopy.section.tasks },
] as const satisfies readonly { value: Side; label: string }[];

/**
 * The one section under Today's tiles: a two-way switch over one list. Orders (they decide the
 * day) or Tasks (the to-dos and the daily logs, which never do). Opens on Orders, or on Tasks once
 * every order is at its full goal. The side is chosen when Today opens and on each return to it,
 * never while the user looks: ticking the last order doesn't swap the list away under the finger.
 * A side the user picks holds until they leave the tab.
 */
export function TodaySection({ rows, isWaiting, ordersFooter, tasks }: TodaySectionProps) {
  const styles = useStyles();
  const returns = useTabReturn();
  const allDone = rows.length > 0 && rows.every((row) => row.status === 'full');
  const [opening, setOpening] = useState<{ returns: number; side: Side | null }>({ returns, side: null });
  const [pick, setPick] = useState<{ returns: number; side: Side } | null>(null);

  // Adjust state while rendering (React's pattern for "state from a changed value"). The rows are
  // empty until today's orders are read, so the opening side waits for them.
  if (opening.returns !== returns) setOpening({ returns, side: null });
  else if (opening.side === null && rows.length > 0)
    setOpening({ returns, side: allDone ? 'tasks' : 'orders' });

  const side = pick?.returns === returns ? pick.side : (opening.side ?? 'orders');
  return (
    <View style={styles.section}>
      <SegmentedControl
        options={OPTIONS}
        value={side}
        onChange={(next) => setPick({ returns, side: next })}
      />
      {side === 'orders' ? (
        <OrderList rows={rows} isWaiting={isWaiting} footer={ordersFooter} />
      ) : (
        <TodayTasks {...tasks} />
      )}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  section: { marginTop: theme.space.xl, gap: theme.space.md },
}));
