import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import {
  cancelAnimation,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { themeSpring, useReduceMotion, useTheme } from '@/theme';

import { useTabReturn } from './useTabReturn';

/** The return motion's shape: small and quick, so a tab feels alive, never busy. */
export const TAB_SETTLE = {
  /** Delay between one tile or bar and the next, top left to bottom right. */
  staggerMs: 40,
  /** Orders past this all start together, so a long screen still finishes in about half a second. */
  maxOrder: 4,
  /** Where a tile's scale starts. */
  scaleFrom: 0.98,
  /** After the delay plus this long the value is set to its end from the JS side, whatever the spring did. */
  deadlineMs: 700,
} as const;

/**
 * A 0 to 1 value that rests at 1 and replays from 0 on the settle spring each time the user comes
 * back to this tab (useTabReturn: not on first open, not on re-renders). `order` staggers it after
 * the items before it. Built so it can never strand content mid-way: nothing plays while the app
 * is not in the foreground or with reduce motion, and the end value is set after a deadline and
 * whenever the app changes state. For graphs: drive a bar's scaleY, a line's reveal or a ring's sweep.
 */
export function useTabRegrow(order = 0): SharedValue<number> {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(1);
  const deadline = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const finish = () => {
      if (deadline.current != null) clearTimeout(deadline.current);
      deadline.current = null;
      cancelAnimation(progress);
      progress.set(1);
    };
    const subscription = AppState.addEventListener('change', finish);
    return () => {
      subscription.remove();
      if (deadline.current != null) clearTimeout(deadline.current);
    };
  }, [progress]);

  useTabReturn(() => {
    if (reduceMotion || AppState.currentState !== 'active') return;
    const delay = Math.min(Math.max(0, order), TAB_SETTLE.maxOrder) * TAB_SETTLE.staggerMs;
    cancelAnimation(progress);
    progress.set(0);
    progress.set(withDelay(delay, withSpring(1, themeSpring('settle'))));
    if (deadline.current != null) clearTimeout(deadline.current);
    deadline.current = setTimeout(() => {
      deadline.current = null;
      cancelAnimation(progress);
      progress.set(1);
    }, delay + TAB_SETTLE.deadlineMs);
  });

  return progress;
}

/**
 * The tile variant: on each return to the tab the tile rises a few points and grows from 0.98 to
 * full size, staggered by `order`. Transforms only, so the tile is always fully visible.
 */
export function useTabSettle(order = 0) {
  const theme = useTheme();
  const progress = useTabRegrow(order);
  const rise = theme.space.sm;
  const scaleFrom = TAB_SETTLE.scaleFrom;
  return useAnimatedStyle(() => {
    const remaining = 1 - progress.get();
    return {
      transform: [{ translateY: remaining * rise }, { scale: 1 - remaining * (1 - scaleFrom) }],
    };
  });
}
