import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { createStyles, themeEasing, useReduceMotion } from '@/theme';

export type ColumnProps = {
  /** fallen: the shaft topples (campaign lost). standing: it rises again in gold (Resurgo). */
  state: 'fallen' | 'standing';
};

// Proportions from the prototype's column.
const COLUMN_WIDTH = 70;
const SLAB_HEIGHT = 14;
const SHAFT_WIDTH = 46;
const SHAFT_HEIGHT = 168;
const FLUTE_COUNT = 3;
const TOPPLE_DEGREES = -24;

/** A Roman column: the broken-campaign motif, and the comeback. Decorative. */
export function Column({ state }: ColumnProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const topple = useSharedValue(0);
  const rise = useSharedValue(state === 'standing' && !reduceMotion ? 0 : 1);

  useEffect(() => {
    if (state === 'fallen') {
      topple.value = reduceMotion
        ? 1
        : withDelay(300, withTiming(1, { duration: 900, easing: Easing.bezier(0.5, 0, 0.7, 1) }));
      return;
    }
    topple.value = 0;
    rise.value = reduceMotion ? 1 : withTiming(1, { duration: 800, easing: themeEasing() });
  }, [state, reduceMotion, topple, rise]);

  const shaftStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${TOPPLE_DEGREES * topple.value}deg` },
      { translateX: -6 * topple.value },
      { translateY: 10 * topple.value },
      { scaleY: rise.value },
    ],
  }));

  return (
    <View style={styles.column} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={styles.slab} />
      <Animated.View style={[styles.shaft, state === 'standing' && styles.shaftStanding, shaftStyle]}>
        {Array.from({ length: FLUTE_COUNT }, (_, index) => (
          <View key={index} style={styles.flute} />
        ))}
      </Animated.View>
      <View style={styles.slab} />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  column: { width: COLUMN_WIDTH, alignItems: 'center' },
  slab: {
    width: COLUMN_WIDTH,
    height: SLAB_HEIGHT,
    borderRadius: theme.space.xxs,
    backgroundColor: theme.colors.textMuted,
  },
  shaft: {
    width: SHAFT_WIDTH,
    height: SHAFT_HEIGHT,
    marginVertical: theme.space.xxs,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: theme.colors.borderStrong,
    transformOrigin: 'bottom',
  },
  shaftStanding: { backgroundColor: theme.colors.accent },
  flute: { width: 2, backgroundColor: theme.colors.background, opacity: 0.25 },
}));
