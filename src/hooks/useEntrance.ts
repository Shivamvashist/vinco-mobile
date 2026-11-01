import { useEffect } from 'react';
import { AppState } from 'react-native';
import { cancelAnimation, type SharedValue, useSharedValue, withSpring } from 'react-native-reanimated';

import { themeSpring, useReduceMotion } from '@/theme';

/** After this long the content is shown in full, whatever the spring did. */
const SETTLE_DEADLINE_MS = 700;

/**
 * A 0 to 1 entrance value for content that fades or rises in when it mounts, built so it can never
 * leave a screen blank. A spring started while the app is not in the foreground (opened from a
 * notification or the focus bubble) can stall on Android and hold the content at 0, so:
 * - it starts at 1 when the app isn't active, or with reduce motion;
 * - it is set to 1 from the JS side after a short deadline, and whenever the app comes back.
 */
export function useEntrance(): SharedValue<number> {
  const reduceMotion = useReduceMotion();
  const enter = useSharedValue(reduceMotion || AppState.currentState !== 'active' ? 1 : 0);

  useEffect(() => {
    const showNow = () => {
      cancelAnimation(enter);
      enter.set(1);
    };
    if (enter.get() < 1) enter.set(withSpring(1, themeSpring('settle')));
    const deadline = setTimeout(showNow, SETTLE_DEADLINE_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') showNow();
    });
    return () => {
      clearTimeout(deadline);
      subscription.remove();
    };
  }, [enter]);

  return enter;
}
