import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';

import { motion } from '@/theme';

/**
 * How the tabs move when the user changes tab, for the tabs navigator's screenOptions.
 *
 * The navigator gives every scene a progress value: -1 for a tab left of the active one, 0 for the
 * active tab, 1 for a tab to its right. Mapping it to a full screen width makes the tabs behave as
 * one strip of pages: going right, the new tab comes in from the right and the old leaves to the
 * left; going left, the reverse. It runs on the `morph` spring (barely any overshoot), on the native
 * driver. With reduce motion on, it is the navigator's plain cross-fade.
 */
export function tabTransitionOptions(width: number, reduceMotion: boolean): BottomTabNavigationOptions {
  if (reduceMotion) return { animation: 'fade' };
  const distance = width > 0 ? width : 1;
  return {
    animation: 'shift',
    transitionSpec: { animation: 'spring', config: { ...motion.spring.morph, overshootClamping: true } },
    sceneStyleInterpolator: ({ current }) => ({
      sceneStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [-distance, 0, distance],
            }),
          },
        ],
      },
    }),
  };
}
