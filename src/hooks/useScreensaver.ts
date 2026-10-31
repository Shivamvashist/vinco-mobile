import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { dimScreen, restoreScreenBrightness } from '@/lib/screenBrightness';

/** No touch for this long and the focus screen goes to sleep. */
export const SCREENSAVER_AFTER_MS = 10_000;
/** The window's brightness while asleep: low, still readable in the dark. */
const DIM_LEVEL = 0.06;

export type Screensaver = {
  /** True after 10 seconds without a touch: the controls fade and the screen dims. */
  isAsleep: boolean;
  /** Any touch: wakes the screen at normal brightness and starts the 10 seconds again. */
  wake: () => void;
};

/**
 * The running focus's screensaver. Dims the app window while asleep and gives the brightness back
 * on any touch, when the screen loses focus, when the app goes to the background, and on unmount.
 * `isEnabled` false (no focus running) keeps it awake.
 */
export function useScreensaver(isEnabled: boolean): Screensaver {
  const isFocused = useIsFocused();
  const [isAsleep, setIsAsleep] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const isDimmed = useRef(false);
  const canSleep = isEnabled && isFocused;

  // The idle clock: restarts on every touch, stops when the screen can't sleep.
  useEffect(() => {
    if (!canSleep) return;
    const timer = setTimeout(() => setIsAsleep(true), SCREENSAVER_AFTER_MS);
    return () => clearTimeout(timer);
  }, [canSleep, touchCount]);

  const shouldDim = canSleep && isAsleep;

  useEffect(() => {
    if (shouldDim) {
      isDimmed.current = true;
      void dimScreen(DIM_LEVEL);
      return;
    }
    if (isDimmed.current) {
      isDimmed.current = false;
      void restoreScreenBrightness();
    }
  }, [shouldDim]);

  // Leaving the app wakes the screen, so it comes back bright.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') return;
      setIsAsleep(false);
      setTouchCount((count) => count + 1);
    });
    return () => subscription.remove();
  }, []);

  // Unmounting (the focus ended, the screen closed) always restores.
  useEffect(
    () => () => {
      if (isDimmed.current) void restoreScreenBrightness();
    },
    [],
  );

  return {
    isAsleep: shouldDim,
    wake: () => {
      if (isAsleep) setIsAsleep(false);
      setTouchCount((count) => count + 1);
    },
  };
}
