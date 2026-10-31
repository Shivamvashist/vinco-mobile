import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { rewardsCopy } from '@/copy';
import { type ColorRole, createStyles, themeSpring, useReduceMotion, useTheme } from '@/theme';

import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Txt } from '../Txt';

import {
  measureCentre,
  registerCounter,
  reportShown,
  type RewardKind,
  shownValue,
  useRewardFlight,
} from './rewardFlight';

export type HudCounterProps = {
  kind: RewardKind;
  /** The real total, from the records. */
  total: number;
  icon: IconName;
  color: ColorRole;
  accessibilityLabel: string;
  onPress: () => void;
  /** A hairline on its left, between counters in the group. */
  hasDivider?: boolean;
  /**
   * Already in the total but not shown yet: a reward waiting for its Claim (a held focus). The
   * counter shows the total minus this until a flight of its kind takes over.
   */
  held?: number;
};

/** A count that springs slightly past its new value and back, like a coin settling. */
const ELASTIC = { damping: 11, stiffness: 160, mass: 0.8 };

/**
 * One counter of the HUD: an icon and an elastic count. While its kind is flying it shows the
 * value from before the claim plus what has landed, then settles on the real total. It puts
 * itself on the flight map while its screen is in front. Reduce motion: the number just changes.
 */
export function HudCounter({
  kind,
  total,
  icon,
  color,
  accessibilityLabel,
  onPress,
  hasDivider = false,
  held = 0,
}: HudCounterProps) {
  const styles = useStyles();
  const theme = useTheme();
  const pillHeight = theme.layout.chipHeight + theme.space.xs;
  // Grows the touch area to at least 44 tall around the slim pill.
  const slop = Math.max(0, (theme.layout.minTouchTarget - pillHeight) / 2);
  const reduceMotion = useReduceMotion();
  const flight = useRewardFlight();
  const isFlying = flight.groups.some((group) => group.kind === kind);
  const target = isFlying ? shownValue(flight, kind, total) : Math.max(0, total - Math.max(0, held));
  const viewRef = useRef<View>(null);
  const [display, setDisplay] = useState(target);
  const count = useSharedValue(target);
  const pulse = useSharedValue(1);

  useFocusEffect(
    useCallback(() => registerCounter(kind, (done) => measureCentre(viewRef.current, done)), [kind]),
  );

  useEffect(() => {
    if (!isFlying) reportShown(kind, total);
  }, [isFlying, kind, total]);

  useEffect(() => {
    if (reduceMotion) {
      count.set(target);
      return;
    }
    if (target > count.get()) {
      pulse.set(withSequence(withSpring(1.3, themeSpring('pop')), withSpring(1, themeSpring('settle'))));
    }
    count.set(withSpring(target, ELASTIC));
  }, [count, pulse, reduceMotion, target]);

  useAnimatedReaction(
    () => Math.round(count.get()),
    (value, previous) => {
      if (value !== previous) scheduleOnRN(setDisplay, value);
    },
  );

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={{ top: slop, bottom: slop }}
      scaleTo="button"
      style={[styles.counter, hasDivider && styles.divider]}
    >
      <View ref={viewRef} collapsable={false}>
        <Animated.View style={pulseStyle}>
          <Icon name={icon} size={theme.layout.iconSizeSmall} color={color} />
        </Animated.View>
      </View>
      <Txt variant="labelSmall" color={color} numberOfLines={1} style={styles.count}>
        {rewardsCopy.hud.count(reduceMotion ? target : display)}
      </Txt>
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    minHeight: theme.layout.chipHeight + theme.space.xs,
    paddingHorizontal: theme.space.sm,
  },
  divider: { borderLeftWidth: theme.layout.hairline, borderLeftColor: theme.colors.border },
  count: { fontVariant: ['tabular-nums'] },
}));
