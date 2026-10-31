import { View } from 'react-native';

import { progressCopy, rewardsCopy } from '@/copy';
import type { DaySummaryOrder } from '@/hooks/useDaySummary';
import { createStyles, useTheme } from '@/theme';

import { Icon } from '../Icon';
import { ProgressRing } from '../ProgressRing';
import { Txt } from '../Txt';

export type DayOrderRingsProps = {
  orders: readonly DaySummaryOrder[];
};

const copy = progressCopy.daySheet;

/**
 * A day's orders as small rings, each filled to its full goal, with a laurel tick at the full goal.
 * They wrap to as many per row as the phone allows.
 */
export function DayOrderRings({ orders }: DayOrderRingsProps) {
  const styles = useStyles();
  const theme = useTheme();
  const size = theme.layout.ringSize * 0.8;
  return (
    <View style={styles.grid}>
      {orders.map((order) => {
        const detail = describeAmount(order);
        return (
          <View key={order.key} style={styles.cell}>
            <ProgressRing
              value={order.full > 0 ? Math.min(1, order.amount / order.full) : 0}
              size={size}
              strokeWidth={theme.layout.ringStrokeWidth * 0.8}
              color={order.status === 'none' ? 'borderStrong' : 'accent'}
              accessibilityLabel={rewardsCopy.daySheet.ringLabel(order.name, detail)}
            >
              {order.status === 'full' ? (
                <Icon name="check" size={theme.layout.iconSizeSmall} color="accent" />
              ) : null}
            </ProgressRing>
            <Txt variant="micro" color="text" align="center" numberOfLines={1}>
              {order.name}
            </Txt>
            <Txt variant="micro" align="center" numberOfLines={1}>
              {detail}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

/** "2 of 4 L", "1 of 2 meals", "8 of 12 glass". */
function describeAmount(order: DaySummaryOrder): string {
  const litres = (value: number) => `${Number(value.toFixed(2))}`;
  switch (order.kind) {
    case 'water':
      return copy.water(litres(order.amount), litres(order.full));
    case 'meal':
      return copy.meal(order.amount, order.full);
    case 'workout':
      return copy.workout(Math.round(order.amount), order.full);
    case 'wake':
      return copy.wake(order.amount > 0);
    case null:
      return copy.own(order.amount, order.full, order.unit);
  }
}

const useStyles = createStyles((theme) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.space.md },
  cell: {
    width: '25%',
    minWidth: theme.layout.ringSize * 1.3,
    flexGrow: 1,
    alignItems: 'center',
    gap: theme.space.xxs,
    paddingHorizontal: theme.space.xxs,
  },
}));
