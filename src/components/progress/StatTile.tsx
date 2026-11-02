import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTabReturn } from '@/hooks/useTabReturn';
import { useTabSettle } from '@/hooks/useTabSettle';
import { cardSurface, type ColorRole, createStyles, motion, useReduceMotion } from '@/theme';

import { Txt } from '../Txt';

export type StatTileProps = {
  value: string;
  label: string;
  /** Colour of the value: accent for the headline stat. */
  color?: ColorRole;
  /** Place in the screen's return stagger (useTabSettle), top left first. Default 0. */
  settleOrder?: number;
};

/** On coming back to the tab, the number rolls up into place on the settle spring. */
const ROLL_IN = FadeInDown.springify()
  .damping(motion.spring.settle.damping)
  .stiffness(motion.spring.settle.stiffness)
  .mass(motion.spring.settle.mass);

/**
 * A big number over its label, as in Vidi's stat row. Read as one item by screen readers.
 * Each time the user comes back to the tab the tile settles and the number rolls in again (not on first open, and
 * never with reduce motion on).
 */
export function StatTile({ value, label, color = 'text', settleOrder = 0 }: StatTileProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const returns = useTabReturn();
  const settleStyle = useTabSettle(settleOrder);

  return (
    <Animated.View style={[styles.tile, settleStyle]} accessible accessibilityLabel={`${value} ${label}`}>
      <View style={styles.window}>
        <Animated.View key={returns} entering={returns > 0 && !reduceMotion ? ROLL_IN : undefined}>
          <Txt variant="heading" color={color} numberOfLines={1}>
            {value}
          </Txt>
        </Animated.View>
      </View>
      <Txt variant="micro" numberOfLines={2} style={styles.label}>
        {label}
      </Txt>
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  tile: {
    flex: 1,
    minWidth: 0,
    padding: theme.space.md,
    ...cardSurface(theme),
  },
  window: { overflow: 'hidden' },
  label: { marginTop: theme.space.xxs },
}));
