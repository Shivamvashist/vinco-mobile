import { useEffect, useRef } from 'react';
import { type AccessibilityActionEvent, Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import {
  createStyles,
  motion,
  themeSpring,
  themeTiming,
  useFeedback,
  useReduceMotion,
  useTheme,
} from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type HoldToConfirmProps = {
  label: string;
  /** Says how long to hold and what happens. */
  accessibilityHint: string;
  holdMs: number;
  onConfirm: () => void;
  icon?: IconName;
};

/**
 * A round button that acts only after a hold: a ring fills under the finger over `holdMs`, and
 * letting go early empties it and does nothing. For a choice that should never happen by accident
 * (giving up a focus). Screen readers get a "hold" action that confirms directly.
 */
export function HoldToConfirm({
  label,
  accessibilityHint,
  holdMs,
  onConfirm,
  icon = 'close',
}: HoldToConfirmProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const reduceMotion = useReduceMotion();
  const fill = useSharedValue(0);
  const press = useSharedValue(1);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const size = theme.layout.buttonHeightLarge + theme.space.lg;
  const stroke = theme.layout.ringStrokeWidth - 1;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => () => clearTimeout(timer.current), []);

  const confirm = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    play('denied');
    onConfirm();
  };

  const handlePressIn = () => {
    play('select');
    clearTimeout(timer.current);
    timer.current = setTimeout(confirm, holdMs);
    cancelAnimation(fill);
    // The fill is the hold's progress, not decoration, so it shows with reduce motion too.
    fill.value = withTiming(1, { duration: holdMs, easing: Easing.linear });
    if (!reduceMotion) press.value = withSpring(motion.pressScale.button, themeSpring('press'));
  };

  const handlePressOut = () => {
    if (!reduceMotion) press.value = withSpring(1, themeSpring('settle'));
    if (timer.current === undefined) return;
    clearTimeout(timer.current);
    timer.current = undefined;
    cancelAnimation(fill);
    fill.value = reduceMotion ? 0 : withTiming(0, themeTiming('fast', 'exit'));
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'longpress') confirm();
  };

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - fill.value) }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityActions={[{ name: 'longpress', label }]}
        onAccessibilityAction={handleAccessibilityAction}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[{ width: size, height: size }, styles.button, pressStyle]}>
          <Svg width={size} height={size} style={styles.ring}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.border}
              strokeWidth={stroke}
              fill="none"
            />
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.danger}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              fill="none"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              animatedProps={ringProps}
            />
          </Svg>
          <Icon name={icon} color="textMuted" />
        </Animated.View>
      </Pressable>
      <Txt variant="labelSmall" color="textMuted" importantForAccessibility="no">
        {label}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { alignItems: 'center', gap: theme.space.sm },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
  ring: { position: 'absolute', top: 0, left: 0 },
}));
