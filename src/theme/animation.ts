import { Easing, type EasingFunctionFactory } from 'react-native-reanimated';

import { motion, type MotionDuration, type MotionEasing, type MotionSpring } from './tokens/motion';

// Every helper here is a worklet: gesture and animation callbacks run on the UI thread, and calling
// a plain JS function there closes the app in a release build (Expo Go only shows a red screen).

/** A Reanimated easing curve from the theme's motion tokens. */
export function themeEasing(name: MotionEasing = 'standard'): EasingFunctionFactory {
  'worklet';
  const [x1, y1, x2, y2] = motion.easing[name];
  return Easing.bezier(x1, y1, x2, y2);
}

/** Timing config for withTiming(): a theme duration plus a theme easing. */
export function themeTiming(duration: MotionDuration = 'base', easingName: MotionEasing = 'standard') {
  'worklet';
  return { duration: motion.duration[duration], easing: themeEasing(easingName) };
}

/** Spring config for withSpring(), from the theme's motion tokens. */
export function themeSpring(name: MotionSpring = 'settle') {
  'worklet';
  return motion.spring[name];
}
