import { useEffect, useState } from 'react';

import { isPackageName } from '@/features/focus';
import { guardBridge } from '@/features/guard';

/** The phone's default Phone app, from the native module; null in Expo Go or when unknown. */
export function useDialerPackage(): string | null {
  const [dialer, setDialer] = useState<string | null>(null);

  useEffect(() => {
    if (!guardBridge.isSupported) return;
    let isMounted = true;
    guardBridge
      .getDialerPackage()
      .then((name) => {
        if (isMounted) setDialer(isPackageName(name) ? name : null);
      })
      .catch((error: unknown) => {
        if (__DEV__) console.warn('[focus] Could not read the Phone app.', error);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return dialer;
}
