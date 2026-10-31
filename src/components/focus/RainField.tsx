import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, type LayoutChangeEvent, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { createStyles, useReduceMotion } from '@/theme';

export type RainFieldProps = {
  /** Paused while the focus screen sleeps or anything else hides it. */
  isPaused?: boolean;
};

/** Pixels in the field, spread by a fixed pattern (no randomness during render). */
const DROPS = Array.from({ length: 14 }, (_, index) => ({
  key: index,
  left: ((index * 37) % 97) / 100,
  duration: 1400 + ((index * 53) % 9) * 160,
  delay: ((index * 71) % 13) * 110,
  isBright: index % 4 === 0,
}));

/**
 * A small field of falling pixels: decorative calm for the running focus. Runs on the UI thread,
 * and stops when the screen is hidden, the app is in the background, or reduce motion is on.
 */
export function RainField({ isPaused = false }: RainFieldProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setIsAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  const isRunning = !isPaused && !reduceMotion && isFocused && isAppActive && height > 0;

  return (
    <View
      style={styles.field}
      onLayout={(event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height)}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {DROPS.map((drop) => (
        <Drop
          key={drop.key}
          left={drop.left}
          duration={drop.duration}
          delay={drop.delay}
          isBright={drop.isBright}
          height={height}
          isRunning={isRunning}
        />
      ))}
    </View>
  );
}

type DropProps = {
  left: number;
  duration: number;
  delay: number;
  isBright: boolean;
  height: number;
  isRunning: boolean;
};

function Drop({ left, duration, delay, isBright, height, isRunning }: DropProps) {
  const styles = useStyles();
  const fall = useSharedValue(0);

  useEffect(() => {
    if (!isRunning) {
      cancelAnimation(fall);
      return;
    }
    fall.set(0);
    fall.set(withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1)));
    return () => cancelAnimation(fall);
  }, [isRunning, duration, delay, fall]);

  const style = useAnimatedStyle(() => ({
    opacity: isRunning ? Math.sin(Math.PI * fall.get()) : 0.35,
    transform: [{ translateY: fall.get() * height }],
  }));

  return (
    <Animated.View style={[styles.drop, isBright && styles.bright, { left: `${left * 100}%` }, style]} />
  );
}

const useStyles = createStyles((theme) => ({
  field: { flex: 1, overflow: 'hidden' },
  drop: {
    position: 'absolute',
    top: 0,
    width: theme.space.xs - 1,
    height: theme.space.xs - 1,
    backgroundColor: theme.colors.info,
  },
  bright: { backgroundColor: theme.colors.accent },
}));
