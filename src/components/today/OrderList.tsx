import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { todayCopy } from '@/copy';
import { type OrderStatus, sortConqueredLast } from '@/features/orders';
import { createStyles, useReduceMotion } from '@/theme';

import { Txt } from '../Txt';

import type { OrderRowContent } from './describeOrderRow';
import { TaskRow } from './TaskRow';

export type OrderListRow = {
  key: string;
  content: OrderRowContent;
  status: OrderStatus;
  onPress: () => void;
  onLongPress: () => void;
};

export type OrderListProps = {
  rows: readonly OrderListRow[];
  /** Before wake-up: rows show dimmed and can't be tapped. */
  isWaiting: boolean;
  /** One quiet line under the heading (how to log, or the run nudge). */
  note: string | null;
  /** Under the rows: the add row, or a suggestion when there are no orders. */
  footer?: ReactNode;
};

/** Rows slide to their new place when an order is finished or undone. */
const ROW_MOVE = LinearTransition.duration(220);

/**
 * Today's orders: open ones first, conquered ones sink to the bottom with their laurel. Tap to
 * log, long press to take one back. The heading counts what's done.
 */
export function OrderList({ rows, isWaiting, note, footer }: OrderListProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const done = rows.filter((row) => row.status === 'full').length;

  return (
    <View>
      <View style={styles.heading}>
        <Txt variant="overline" accessibilityRole="header" style={styles.title}>
          {todayCopy.ordersSection}
        </Txt>
        {rows.length > 0 ? <Txt variant="caption">{todayCopy.ordersCount(done, rows.length)}</Txt> : null}
      </View>
      {note ? (
        <Txt variant="caption" style={styles.note}>
          {note}
        </Txt>
      ) : null}
      <View
        style={[styles.rows, isWaiting && styles.waiting]}
        pointerEvents={isWaiting ? 'none' : 'auto'}
        importantForAccessibility={isWaiting ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={isWaiting}
      >
        {sortConqueredLast(rows).map((row) => (
          <Animated.View key={row.key} layout={reduceMotion ? undefined : ROW_MOVE}>
            <TaskRow
              name={row.content.name}
              line={row.content.line}
              status={row.status}
              action={row.content.action}
              segments={row.content.segments}
              onPress={row.onPress}
              onLongPress={row.onLongPress}
              accessibilityLabel={`${row.content.name}, ${row.content.line}`}
              accessibilityHint={row.content.hint}
            />
          </Animated.View>
        ))}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space.sm,
    marginTop: theme.space.xl,
    marginBottom: theme.space.sm,
  },
  title: { flexShrink: 1 },
  note: { marginBottom: theme.space.sm },
  rows: { gap: theme.space.sm },
  waiting: { opacity: 0.45 },
  footer: { marginTop: theme.space.sm, gap: theme.space.sm },
}));
