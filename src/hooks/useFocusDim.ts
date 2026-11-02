import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { dimScreen, restoreScreenBrightness } from '@/lib/screenBrightness';

/**
 * The app is in front: anything but 'background' and 'inactive' (the first state can read
 * 'unknown' before the phone reports one; the screen showing it is in front).
 */
export function isInFront(state: AppStateStatus | null | undefined): boolean {
  return state !== 'background' && state !== 'inactive';
}

/** The window's brightness on the running focus: low, still readable in the dark. */
export const FOCUS_DIM = {
  /** The screensaver (10 seconds without a touch). */
  asleep: 0.06,
  /** The full-screen rain: a touch brighter, so the drops show. */
  rain: 0.12,
} as const;

/**
 * Dims this app's window to `level` (null: normal brightness) on the running focus. The one owner
 * of the focus brightness, so the screensaver and the full-screen rain never fight over it. The
 * brightness comes back the moment `level` is null, the screen loses focus, the app leaves the
 * foreground, or the screen unmounts (the focus ended); it dims again on return when still asked.
 */
export function useFocusDim(level: number | null): void {
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(isInFront(AppState.currentState));
  const isDimmed = useRef(false);
  const target = isFocused && isAppActive ? level : null;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setIsAppActive(isInFront(state)));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (target != null) {
      isDimmed.current = true;
      void dimScreen(target);
      return;
    }
    if (isDimmed.current) {
      isDimmed.current = false;
      void restoreScreenBrightness();
    }
  }, [target]);

  // Unmounting (the focus ended, the screen closed) always restores.
  useEffect(
    () => () => {
      if (isDimmed.current) void restoreScreenBrightness();
    },
    [],
  );
}
