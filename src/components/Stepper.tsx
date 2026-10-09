import { useEffect, useRef } from 'react';
import { type AccessibilityActionEvent, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { commonCopy } from '@/copy';
import { roundToHundredths } from '@/lib/progress';
import { createStyles, useFeedback, useReduceMotion } from '@/theme';

import { Txt } from './Txt';

export type StepperProps = {
  /** Small label over the value, such as "Conquer". Shown in accent. */
  caption: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** How the value reads: 4 becomes "4 litres". */
  formatValue: (value: number) => string;
  /** What the control is, for screen readers: "Water full goal". */
  accessibilityLabel: string;
};

const BUMP_MS = 100;
const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }];

/**
 * Adjusts a number within limits: the caption and value, then minus and plus.
 * At a limit the button plays `denied` and nothing changes. TalkBack users swipe up or down to adjust.
 */
export function Stepper({
  caption,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
  accessibilityLabel,
}: StepperProps) {
  const styles = useStyles();
  const play = useFeedback();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const previousValue = useRef(value);

  const safeValue = roundToHundredths(Math.min(max, Math.max(min, value)));
  const canDecrease = safeValue > min;
  const canIncrease = safeValue < max;

  useEffect(() => {
    if (previousValue.current === value) return;
    previousValue.current = value;
    if (reduceMotion) return;
    scale.value = withSequence(withTiming(1.18, { duration: BUMP_MS }), withTiming(1, { duration: BUMP_MS }));
  }, [value, reduceMotion, scale]);

  const bumpStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const change = (direction: 1 | -1) => {
    const allowed = direction === 1 ? canIncrease : canDecrease;
    if (!allowed) {
      play('denied');
      return;
    }
    const next = roundToHundredths(Math.min(max, Math.max(min, safeValue + direction * step)));
    play(direction === 1 ? 'stepUp' : 'stepDown');
    onChange(next);
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') change(1);
    if (event.nativeEvent.actionName === 'decrement') change(-1);
  };

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: formatValue(safeValue) }}
      accessibilityActions={ACCESSIBILITY_ACTIONS}
      onAccessibilityAction={handleAccessibilityAction}
    >
      <View style={styles.text}>
        <Txt variant="micro" color="accent">
          {caption}
        </Txt>
        <Animated.View style={[styles.valueWrap, bumpStyle]}>
          <Txt variant="label" numberOfLines={1}>
            {formatValue(safeValue)}
          </Txt>
        </Animated.View>
      </View>
      <StepButton symbol="−" label={commonCopy.decrease} isEnabled={canDecrease} onPress={() => change(-1)} />
      <StepButton symbol="+" label={commonCopy.increase} isEnabled={canIncrease} onPress={() => change(1)} />
    </View>
  );
}

type StepButtonProps = {
  symbol: string;
  label: string;
  isEnabled: boolean;
  onPress: () => void;
};

function StepButton({ symbol, label, isEnabled, onPress }: StepButtonProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !isEnabled }}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Txt variant="heading" color={isEnabled ? 'text' : 'textFaint'}>
        {symbol}
      </Txt>
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  valueWrap: { alignSelf: 'flex-start', marginTop: theme.space.xxs },
  button: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
}));
