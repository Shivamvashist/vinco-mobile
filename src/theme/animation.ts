import { Easing, type EasingFunctionFactory } from 'react-native-reanimated';

import { motion, type MotionDuration, type MotionEasing, type MotionSpring } from './tokens/motion';

// Every helper here is a worklet: gesture and animation callbacks run on the UI thread, and calling
// a plain JS function there closes the app in a release build (Expo Go only shows a red screen).

/** A Reanimated easing curve from the theme's motion tokens. */
export function themeEasing(name: MotionEasing = 'standard'): EasingFunctionFactory {
  'worklet';
  // Index access, not array destructuring: the build can turn destructuring into a helper that
  // doesn't exist on the UI thread.
  const curve = motion.easing[name];
  return Easing.bezier(curve[0], curve[1], curve[2], curve[3]);
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
