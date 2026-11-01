import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { todayCopy } from '@/copy';
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
 * day) or Tasks (the to-dos and the daily logs, which never do). Opens on Orders.
 */
export function TodaySection({ rows, isWaiting, ordersFooter, tasks }: TodaySectionProps) {
  const styles = useStyles();
  const [side, setSide] = useState<Side>('orders');
  return (
    <View style={styles.section}>
      <SegmentedControl options={OPTIONS} value={side} onChange={setSide} />
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
