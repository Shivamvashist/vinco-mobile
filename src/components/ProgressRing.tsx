import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { clampProgress } from '@/lib/progress';
import { type ColorRole, createStyles, themeEasing, useTheme, useReduceMotion } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** The prototype animates the ring over 600 ms with the standard curve. */
const RING_DURATION_MS = 600;

export type ProgressRingProps = {
  /** 0 to 1. */
  value: number;
  /** What a screen reader says, for example "2 of 4 orders held". */
  accessibilityLabel: string;
  size?: number;
  strokeWidth?: number;
  color?: ColorRole;
  /** Centre content, such as "2/4". */
  children?: ReactNode;
};

/** A circular progress arc that starts at 12 o'clock and fills clockwise. */
export function ProgressRing({
  value,
  accessibilityLabel,
  size,
  strokeWidth,
  color = 'accent',
  children,
}: ProgressRingProps) {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const dimension = size ?? theme.layout.ringSize;
  const stroke = strokeWidth ?? theme.layout.ringStrokeWidth;
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clampProgress(value);
  const animated = useSharedValue(progress);

  useEffect(() => {
    animated.value = reduceMotion
      ? progress
      : withTiming(progress, { duration: RING_DURATION_MS, easing: themeEasing('standard') });
  }, [progress, reduceMotion, animated]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  return (
    <View
      style={{ width: dimension, height: dimension }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Svg width={dimension} height={dimension} accessible={false}>
        <Circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke={theme.colors[color]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          fill="none"
          transform={`rotate(-90 ${dimension / 2} ${dimension / 2})`}
          animatedProps={arcProps}
        />
      </Svg>
      {children ? <View style={styles.centre}>{children}</View> : null}
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
