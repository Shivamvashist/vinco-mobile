import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { type OrderStatus, sortConqueredLast } from '@/features/orders';
import { createStyles, useReduceMotion } from '@/theme';

import type { OrderRowContent } from './describeOrderRow';
import { type RowControls, TaskRow } from './TaskRow';

export type OrderListRow = {
  key: string;
  content: OrderRowContent;
  status: OrderStatus;
  /** Minus and plus, or a check that toggles. */
  controls?: RowControls;
  onPress: () => void;
  onLongPress: () => void;
};

export type OrderListProps = {
  rows: readonly OrderListRow[];
  /** Before wake-up: rows show dimmed and can't be tapped. */
  isWaiting: boolean;
  /** Under the rows: the add row, or a suggestion when there are no orders. */
  footer?: ReactNode;
};

/** Rows slide to their new place when an order is finished or undone. */
const ROW_MOVE = LinearTransition.duration(220);

/**
 * Today's orders: open ones first, conquered ones sink to the bottom with their laurel. Tap to
 * log, long press to take one back; rows with levels also show a minus and a plus, done-or-not rows
 * a check that toggles. The section switch above it is the heading.
 */
export function OrderList({ rows, isWaiting, footer }: OrderListProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();

  return (
    <View>
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
              controls={row.controls}
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
  rows: { gap: theme.space.sm },
  waiting: { opacity: 0.45 },
  footer: { marginTop: theme.space.sm, gap: theme.space.sm },
}));
