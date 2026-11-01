import { useEffect } from 'react';
import { AppState } from 'react-native';
import { cancelAnimation, type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { themeTiming, useReduceMotion } from '@/theme';

/** After this long the fade is set to its end from the JS side, whatever the timing did. */
const SETTLE_DEADLINE_MS = 900;

/**
 * A 0 to 1 value that eases to 1 while `isOn` and back to 0 when not, for cross-fading two faces
 * of one card. Built so a stalled animation (the app in the background) can never leave both faces
 * half shown: the end value is set after a deadline and when the app comes back. Instant with
 * reduce motion.
 */
export function useCrossFade(isOn: boolean): SharedValue<number> {
  const reduceMotion = useReduceMotion();
  const target = isOn ? 1 : 0;
  const value = useSharedValue(target);

  useEffect(() => {
    const settle = () => {
      cancelAnimation(value);
      value.set(target);
    };
    if (reduceMotion || AppState.currentState !== 'active') {
      settle();
      return;
    }
    value.set(withTiming(target, themeTiming('slow')));
    const deadline = setTimeout(settle, SETTLE_DEADLINE_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') settle();
    });
    return () => {
      clearTimeout(deadline);
      subscription.remove();
    };
  }, [value, target, reduceMotion]);

  return value;
}
