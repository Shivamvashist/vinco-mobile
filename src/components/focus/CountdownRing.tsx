import { useEffect, type ReactNode } from 'react';
import { AppState, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { remainingShare } from '@/features/focus';
import { createStyles, useReduceMotion, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type CountdownRingProps = {
  /** ISO timestamps of the focus. */
  startedAt: string;
  endsAt: string;
  /** Milliseconds left, from the ticking clock: with reduce motion the ring steps on it. */
  remainingMs: number;
  size: number;
  strokeWidth: number;
  children?: ReactNode;
};

/**
 * The focus countdown: an accent arc from 12 o'clock that shrinks to nothing at the end, with a
 * bright head. It runs on the UI thread as one linear timing to the end (no JS frames), and re-syncs
 * with the clock when the app comes back. With reduce motion it steps once a second.
 */
export function CountdownRing({
  startedAt,
  endsAt,
  remainingMs,
  size,
  strokeWidth,
  children,
}: CountdownRingProps) {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const share = useSharedValue(remainingShare({ startedAt, endsAt }, new Date()));
  const radius = (size - strokeWidth) / 2;
  const centre = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Reduce motion: follow the ticking clock.
  useEffect(() => {
    if (reduceMotion) share.value = remainingShare({ startedAt, endsAt }, new Date());
  }, [reduceMotion, remainingMs, startedAt, endsAt, share]);

  // Otherwise: one smooth run to the end, restarted whenever the app returns.
  useEffect(() => {
    if (reduceMotion) return;
    const sync = () => {
      const now = new Date();
      // Setting a value cancels the running timing, so each sync starts clean.
      share.set(remainingShare({ startedAt, endsAt }, now));
      const left = Math.max(0, Date.parse(endsAt) - now.getTime());
      share.set(withTiming(0, { duration: left, easing: Easing.linear }));
    };
    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => subscription.remove();
  }, [reduceMotion, startedAt, endsAt, share]);

  const arcProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - share.value) }));
  const headProps = useAnimatedProps(() => {
    const angle = 2 * Math.PI * share.value;
    return {
      cx: centre + radius * Math.sin(angle),
      cy: centre - radius * Math.cos(angle),
      opacity: share.value > 0 ? 1 : 0,
    };
  });

  return (
    <View style={{ width: size, height: size }} importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size}>
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={theme.colors.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          fill="none"
          transform={`rotate(-90 ${centre} ${centre})`}
          animatedProps={arcProps}
        />
        <AnimatedCircle r={strokeWidth * 1.1} fill={theme.colors.accent} animatedProps={headProps} />
        <AnimatedCircle r={strokeWidth * 0.45} fill={theme.colors.onAccent} animatedProps={headProps} />
      </Svg>
      <View style={styles.centre}>{children}</View>
    </View>
  );
}

const useStyles = createStyles(() => ({
  centre: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
