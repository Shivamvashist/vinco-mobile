import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { guardBridge } from '@/features/guard';
import type { NightRest } from '@/features/sleep';

export type NightRestReading = {
  /** Last night's rest as the phone saw it, or null (none known, Expo Go, guard service off). */
  rest: NightRest | null;
  /** When it was read, to check it against (`getUsableBedtime`). */
  readAt: Date;
};

/**
 * Last night's rest from the screen's on and off times (guardBridge), read on mount and each time
 * Vinco comes back to the front, so the morning's reading is fresh. Null where unsupported.
 */
export function useNightRest(): NightRestReading {
  const [reading, setReading] = useState<NightRestReading>(() => ({ rest: null, readAt: new Date() }));

  useEffect(() => {
    if (!guardBridge.isSupported) return;
    let isCancelled = false;
    const read = () => {
      guardBridge
        .getNightRest()
        .then((rest) => {
          if (!isCancelled) setReading({ rest, readAt: new Date() });
        })
        .catch((error: unknown) => {
          if (__DEV__) console.warn('[sleep] Could not read the night rest.', error);
        });
    };
    read();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') read();
    });
    return () => {
      isCancelled = true;
      subscription.remove();
    };
  }, []);

  return reading;
}
