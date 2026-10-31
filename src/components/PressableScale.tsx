import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { motion, themeSpring, useReduceMotion } from '@/theme';

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  /** How far it gives under the finger: a button more, a card or row less. */
  scaleTo?: keyof typeof motion.pressScale;
  /** Applied to the moving surface (background, border, radius live here). */
  style?: StyleProp<ViewStyle>;
  /** Extra style while pressed (a colour change); the scale is added on top. */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Layout of the touch area itself (flex, alignSelf, margins), which the moving surface fills. */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * The app's press: the surface gives a little under the finger and springs back when released,
 * like a physical key. The spring is interruptible, so quick taps never stack up. With reduce
 * motion on, it keeps only the pressed style.
 */
export function PressableScale({
  children,
  scaleTo = 'button',
  style,
  pressedStyle,
  containerStyle,
  onPressIn,
  onPressOut,
  disabled,
  ...pressableProps
}: PressableScaleProps) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Pressable
      {...pressableProps}
      disabled={disabled}
      style={containerStyle}
      onPressIn={(event) => {
        if (!reduceMotion) scale.set(withSpring(motion.pressScale[scaleTo], themeSpring('press')));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!reduceMotion) scale.set(withSpring(1, themeSpring('settle')));
        onPressOut?.(event);
      }}
    >
      {({ pressed }) => (
        <Animated.View style={[style, pressed && pressedStyle, animated]}>{children}</Animated.View>
      )}
    </Pressable>
  );
}
