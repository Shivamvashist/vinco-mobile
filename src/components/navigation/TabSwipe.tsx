import { useIsFocused, useNavigation } from 'expo-router';
import type { BottomTabNavigationProp } from 'expo-router/js-tabs';
import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { isTabName } from '@/copy';
import { resolveSwipeTarget } from '@/lib/tabSwipe';
import { createStyles, themeSpring, useFeedback, useReduceMotion } from '@/theme';

export type TabSwipeProps = {
  children: ReactNode;
};

type TabNavigation = BottomTabNavigationProp<Record<string, object | undefined>>;

/** The drag only starts past this much sideways travel, and fails first on this much vertical. */
const ACTIVE_OFFSET_X = 24;
const FAIL_OFFSET_Y = 14;
/** The content follows the finger at this share of the drag, up to a share of the width. */
const FOLLOW = 0.25;
const MAX_FOLLOW_SHARE = 0.08;

/**
 * Wraps one tab's content so a sideways swipe moves to the next or previous tab (Veni, Vidi,
 * Vici), with the tab whoosh. The content leans a little with the finger and springs back; the
 * navigator's slide does the rest.
 *
 * It stays out of the way: it starts only past a clear sideways threshold and fails as soon as the
 * drag is vertical, so lists scroll. A native horizontal list (the focus ruler, the card designs)
 * cancels it as soon as it starts scrolling, and sheets and menus are Modals, which this never sees.
 */
export function TabSwipe({ children }: TabSwipeProps) {
  const styles = useStyles();
  const navigation = useNavigation<TabNavigation>();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const play = useFeedback();
  const lean = useSharedValue(0);
  const maxLean = width * MAX_FOLLOW_SHARE;

  const handleSwipeEnd = (translationX: number, velocityX: number) => {
    const state = navigation.getState();
    const current = state.routes[state.index];
    const tabs = state.routes.filter((route) => isTabName(route.name));
    const index = tabs.findIndex((route) => route.key === current?.key);
    if (index < 0) return;
    const target = resolveSwipeTarget({ index, count: tabs.length, translationX, velocityX, width });
    const route = target == null ? undefined : tabs[target];
    if (!route) return;
    play('whoosh');
    navigation.navigate(route.name, route.params);
  };

  const pan = Gesture.Pan()
    // Only the tab on screen listens; one leaving mid-slide does not.
    .enabled(isFocused)
    .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
    .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
    .onUpdate((event) => {
      if (reduceMotion) return;
      lean.set(Math.max(-maxLean, Math.min(maxLean, event.translationX * FOLLOW)));
    })
    .onEnd((event) => {
      scheduleOnRN(handleSwipeEnd, event.translationX, event.velocityX);
    })
    .onFinalize(() => {
      lean.set(reduceMotion ? 0 : withSpring(0, themeSpring('settle')));
    });

  const leanStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lean.get() }] }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.fill, leanStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const useStyles = createStyles(() => ({ fill: { flex: 1 } }));
