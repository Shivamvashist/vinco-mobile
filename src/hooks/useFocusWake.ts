import { useEffect } from 'react';
import { AppState } from 'react-native';
import { cancelAnimation, type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { themeTiming, useReduceMotion } from '@/theme';

/**
 * The running focus's controls, 1 shown and 0 faded (the screensaver). Fades only while the app is
 * in front: a fade started while the app is leaving or away can stall on Android and hold the
 * controls at 0, which left a blank screen when the guard's alert brought Vinco back. So the value
 * snaps to where it should be on every app state change, and is set at once when not in front.
 */
export function useFocusWake(isAsleep: boolean): SharedValue<number> {
  const reduceMotion = useReduceMotion();
  const awake = useSharedValue(1);

  useEffect(() => {
    const target = isAsleep ? 0 : 1;
    const snap = () => {
      cancelAnimation(awake);
      awake.set(target);
    };
    if (reduceMotion || AppState.currentState !== 'active') snap();
    else awake.set(withTiming(target, themeTiming('slower')));
    const subscription = AppState.addEventListener('change', snap);
    return () => subscription.remove();
  }, [isAsleep, reduceMotion, awake]);

  return awake;
}
