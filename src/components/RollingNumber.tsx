import { type StyleProp, type TextStyle, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { type ColorRole, motion, type TextVariant, useReduceMotion } from '@/theme';

import { Txt } from './Txt';

export type RollingNumberProps = {
  /** The text to show: "12", "6:30", "1,240". A change rolls the old one up and the new one in. */
  value: string;
  variant?: TextVariant;
  color?: ColorRole;
  style?: StyleProp<TextStyle>;
  /** What a screen reader says, when the bare value isn't enough. */
  accessibilityLabel?: string;
};

/** The new value rises in on the settle spring; the old one lifts away quickly. */
const ENTER = FadeInDown.springify()
  .damping(motion.spring.settle.damping)
  .stiffness(motion.spring.settle.stiffness)
  .mass(motion.spring.settle.mass);
const EXIT = FadeOutUp.duration(motion.duration.fast);

/**
 * A number that rolls when it changes, like a mechanical counter: the hero count, the run, the
 * purse. Keyed by value, so each change is one short, interruptible motion. With reduce motion
 * on it simply changes.
 */
export function RollingNumber({
  value,
  variant = 'numeral',
  color,
  style,
  accessibilityLabel,
}: RollingNumberProps) {
  const reduceMotion = useReduceMotion();
  return (
    <View
      style={{ overflow: 'hidden' }}
      accessible
      accessibilityLabel={accessibilityLabel ?? value}
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        key={value}
        entering={reduceMotion ? undefined : ENTER}
        exiting={reduceMotion ? undefined : EXIT}
      >
        <Txt variant={variant} color={color} style={[{ fontVariant: ['tabular-nums'] }, style]}>
          {value}
        </Txt>
      </Animated.View>
    </View>
  );
}
