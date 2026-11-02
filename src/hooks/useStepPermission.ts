import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

/**
 * unknown: not read yet; granted; denied: can be asked; blocked: Android won't ask again (only the
 * app's settings page can allow it); unavailable: no step counter on this phone.
 */
export type StepPermissionState = 'unknown' | 'granted' | 'denied' | 'blocked' | 'unavailable';

export type StepPermission = {
  state: StepPermissionState;
  /** Asks for "Physical activity" (or opens the app's settings when Android won't ask again). */
  request: () => Promise<void>;
};

async function readState(): Promise<StepPermissionState> {
  if (!(await Pedometer.isAvailableAsync())) return 'unavailable';
  const permission = await Pedometer.getPermissionsAsync();
  if (permission.granted) return 'granted';
  return permission.canAskAgain ? 'denied' : 'blocked';
}

/**
 * The step counter's permission ("Physical activity", Android 10+), for the march. Asked ahead on
 * the Aurora screen, never at ring time (useMarch only reads it). Read again when the user comes
 * back from the settings page. Denial is fine: the march then counts taps.
 */
export function useStepPermission(): StepPermission {
  const [state, setState] = useState<StepPermissionState>('unknown');

  const refresh = useCallback(async () => {
    try {
      setState(await readState());
    } catch (error) {
      if (__DEV__) console.warn('[aurora] Could not read the step counter permission.', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [refresh]);

  const request = useCallback(async () => {
    try {
      if (state === 'blocked') {
        await Linking.openSettings();
        return;
      }
      if (state === 'granted' || state === 'unavailable') return;
      await Pedometer.requestPermissionsAsync();
    } catch (error) {
      if (__DEV__) console.warn('[aurora] Could not ask for the step counter.', error);
    }
    await refresh();
  }, [state, refresh]);

  return { state, request };
}
