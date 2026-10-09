import { Easing, type EasingFunctionFactory } from 'react-native-reanimated';

import { motion, type MotionDuration, type MotionEasing } from './tokens/motion';

/** A Reanimated easing curve from the theme's motion tokens. */
export function themeEasing(name: MotionEasing = 'standard'): EasingFunctionFactory {
  const [x1, y1, x2, y2] = motion.easing[name];
  return Easing.bezier(x1, y1, x2, y2);
}

/** Timing config for withTiming(): a theme duration plus a theme easing. */
export function themeTiming(duration: MotionDuration = 'base', easingName: MotionEasing = 'standard') {
  return { duration: motion.duration[duration], easing: themeEasing(easingName) };
}
