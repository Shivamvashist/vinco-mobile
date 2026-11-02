import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { isInFront } from './useFocusDim';

/** No touch for this long and the focus screen goes to sleep. */
export const SCREENSAVER_AFTER_MS = 10_000;

export type Screensaver = {
  /** True after 10 seconds without a touch: the controls fade and the screen dims (useFocusDim). */
  isAsleep: boolean;
  /** Any touch: wakes the screen and starts the 10 seconds again. */
  wake: () => void;
};

/**
 * The running focus's screensaver: asleep after 10 seconds without a touch. The 10 seconds count
 * only while the app is in front and the screen has focus: leaving the app wakes it, and coming
 * back starts the count again, so a return (from the guard's alert, the bubble or a notification)
 * always lands on the awake screen, never on one that falls asleep the moment it shows.
 * `isEnabled` false (no focus running, or the full-screen rain) keeps it awake.
 */
export function useScreensaver(isEnabled: boolean): Screensaver {
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(isInFront(AppState.currentState));
  const [isAsleep, setIsAsleep] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const canSleep = isEnabled && isFocused && isAppActive;

  // The idle clock: restarts on every touch and on every return, stops when the screen can't sleep.
  useEffect(() => {
    if (!canSleep) return;
    const timer = setTimeout(() => setIsAsleep(true), SCREENSAVER_AFTER_MS);
    return () => clearTimeout(timer);
  }, [canSleep, touchCount]);

  // Leaving the app wakes the screen, so it comes back awake.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const isActive = isInFront(state);
      setIsAppActive(isActive);
      if (!isActive) setIsAsleep(false);
    });
    return () => subscription.remove();
  }, []);

  return {
    isAsleep: canSleep && isAsleep,
    wake: () => {
      if (isAsleep) setIsAsleep(false);
      setTouchCount((count) => count + 1);
    },
  };
}
