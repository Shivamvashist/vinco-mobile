import { useEffect, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { OrderStatus } from '@/features/orders';
import { createStyles, useTheme, useReduceMotion } from '@/theme';

import { Icon } from './Icon';

export type StatusCircleProps = {
  status: OrderStatus;
  size?: number;
};

/** The pop from the prototype: shrink, overshoot, settle. */
const POP_STEP_MS = 120;

/**
 * Shows an order's status. Pops when the status changes, never on first render,
 * so opening a screen with finished orders doesn't fire a burst of animations.
 * Decorative: the row it sits in announces the status.
 */
export function StatusCircle({ status, size }: StatusCircleProps) {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const dimension = size ?? theme.layout.statusCircleSize;
  const scale = useSharedValue(1);
  const previousStatus = useRef(status);

  useEffect(() => {
    if (previousStatus.current === status) return;
    previousStatus.current = status;
    if (reduceMotion) return;
    scale.value = withSequence(
      withTiming(0.6, { duration: 0 }),
      withTiming(1.2, { duration: POP_STEP_MS * 2 }),
      withTiming(1, { duration: POP_STEP_MS }),
    );
  }, [status, reduceMotion, scale]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        styles.circle,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
        styles[status],
        popStyle,
      ]}
    >
      {status === 'full' ? (
        <Icon name="check" size={dimension * 0.53} color="onAccent" strokeWidth={3} />
      ) : null}
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  none: { borderColor: theme.colors.borderStrong },
  min: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentFill },
  full: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent },
}));
