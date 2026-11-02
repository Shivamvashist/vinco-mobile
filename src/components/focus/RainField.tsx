import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, type LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { createStyles, useReduceMotion, useTheme } from '@/theme';

export type RainFieldProps = {
  /** Paused while the focus screen sleeps or anything else hides it. */
  isPaused?: boolean;
  /** `tile`: a few quick drops in the rain tile. `full`: more, slower drops over the whole screen. */
  variant?: 'tile' | 'full';
};

/**
 * Pixels in the field, spread by a fixed pattern (no randomness during render). `pace` slows the
 * fall for a taller field; `rest` is where a drop waits when nothing moves (reduce motion, paused).
 */
function makeDrops(count: number, pace: number) {
  return Array.from({ length: count }, (_, index) => ({
    key: index,
    left: ((index * 37) % 97) / 100,
    duration: Math.round((1400 + ((index * 53) % 9) * 160) * pace),
    delay: Math.round(((index * 71) % 13) * 110 * pace),
    rest: ((index * 29) % 89) / 100,
    isBright: index % 4 === 0,
  }));
}

const DROPS = { tile: makeDrops(16, 1), full: makeDrops(44, 2.4) } as const;

/** Ripples alive at once: a fourth tap reuses the oldest. */
const RIPPLE_SLOTS = [0, 1, 2] as const;
const RIPPLE_MS = 1100;
/** The second ring follows the first by this share of the ripple. */
const INNER_LAG = 0.28;

type Tap = { x: number; y: number; count: number };

/**
 * A small field of falling pixels, calm company for the running focus. A tap drops a ripple where
 * the finger landed (two rings that spread and fade, on the UI thread). The drops stop when the
 * screen is hidden, asleep or in the background; with reduce motion nothing moves (the drops rest,
 * spread over the field).
 */
export function RainField({ isPaused = false, variant = 'tile' }: RainFieldProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [height, setHeight] = useState(0);
  const tap = useSharedValue<Tap>({ x: 0, y: 0, count: 0 });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setIsAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  const isRunning = !isPaused && !reduceMotion && isFocused && isAppActive && height > 0;

  // Only shared values are touched here, so the callback stays on the UI thread.
  const touch = Gesture.Tap()
    .enabled(!reduceMotion)
    .maxDistance(24)
    .onStart((event) => {
      tap.set({ x: event.x, y: event.y, count: tap.get().count + 1 });
    });

  return (
    <GestureDetector gesture={touch}>
      <View
        style={styles.field}
        onLayout={(event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height)}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {DROPS[variant].map((drop) => (
          <Drop
            key={drop.key}
            left={drop.left}
            duration={drop.duration}
            delay={drop.delay}
            rest={drop.rest}
            isBright={drop.isBright}
            height={height}
            isRunning={isRunning}
          />
        ))}
        {reduceMotion ? null : RIPPLE_SLOTS.map((slot) => <Ripple key={slot} slot={slot} tap={tap} />)}
      </View>
    </GestureDetector>
  );
}

type DropProps = {
  left: number;
  duration: number;
  delay: number;
  /** Where the drop waits, as a share of the height, while nothing moves. */
  rest: number;
  isBright: boolean;
  height: number;
  isRunning: boolean;
};

function Drop({ left, duration, delay, rest, isBright, height, isRunning }: DropProps) {
  const styles = useStyles();
  const fall = useSharedValue(rest);

  useEffect(() => {
    if (!isRunning) {
      // Resting drops spread over the field (with reduce motion they never move from here).
      cancelAnimation(fall);
      fall.set(rest);
      return;
    }
    fall.set(0);
    fall.set(withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1)));
    return () => cancelAnimation(fall);
  }, [isRunning, duration, delay, rest, fall]);

  const style = useAnimatedStyle(() => ({
    opacity: isRunning ? Math.sin(Math.PI * fall.get()) : 0.35,
    transform: [{ translateY: fall.get() * height }],
  }));

  return (
    <Animated.View style={[styles.drop, isBright && styles.bright, { left: `${left * 100}%` }, style]} />
  );
}

/** One ripple slot: it plays when a tap lands on its turn (taps take the slots in order). */
function Ripple({ slot, tap }: { slot: number; tap: SharedValue<Tap> }) {
  const theme = useTheme();
  const styles = useStyles();
  const radius = theme.space.huge;
  const progress = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  useAnimatedReaction(
    () => tap.get().count,
    (count, previous) => {
      if (count === previous || count === 0 || count % RIPPLE_SLOTS.length !== slot) return;
      x.set(tap.get().x);
      y.set(tap.get().y);
      progress.set(0);
      progress.set(withTiming(1, { duration: RIPPLE_MS, easing: Easing.out(Easing.quad) }));
    },
  );

  const outer = useAnimatedStyle(() => ({
    opacity: (1 - progress.get()) * 0.9,
    transform: [
      { translateX: x.get() - radius },
      { translateY: y.get() - radius },
      { scale: 0.1 + 0.9 * progress.get() },
    ],
  }));
  const inner = useAnimatedStyle(() => {
    const lagged = Math.max(0, (progress.get() - INNER_LAG) / (1 - INNER_LAG));
    return {
      opacity: progress.get() < INNER_LAG ? 0 : (1 - lagged) * 0.6,
      transform: [
        { translateX: x.get() - radius },
        { translateY: y.get() - radius },
        { scale: 0.1 + 0.6 * lagged },
      ],
    };
  });

  const ring = { width: radius * 2, height: radius * 2, borderRadius: radius };
  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.ring, ring, outer]} />
      <Animated.View pointerEvents="none" style={[styles.ring, styles.innerRing, ring, inner]} />
    </>
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
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: theme.layout.borderWidthStrong,
    borderColor: theme.colors.info,
  },
  innerRing: { borderColor: theme.colors.accent },
}));
