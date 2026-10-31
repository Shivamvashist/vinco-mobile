import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { guardBridge, type GuardPermission } from '@/features/guard';

export type GuardPermissions = {
  /** False in Expo Go and older builds: no blocking, no permission to ask for. */
  isSupported: boolean;
  /** Null until the first read. */
  granted: Record<GuardPermission, boolean> | null;
  /** Opens the phone's settings page for a permission (after the in-app disclosure). */
  open: (permission: GuardPermission) => void;
};

/**
 * The focus guard's permissions, read on mount and again whenever the app comes back to the
 * foreground (the user may have just turned one on in the phone's settings).
 */
export function useGuardPermissions(): GuardPermissions {
  const [granted, setGranted] = useState<Record<GuardPermission, boolean> | null>(null);

  useEffect(() => {
    if (!guardBridge.isSupported) return;
    let isMounted = true;
    const read = () => {
      guardBridge
        .getPermissions()
        .then((next) => {
          if (isMounted) setGranted(next);
        })
        .catch((error: unknown) => {
          if (__DEV__) console.warn('[focus] Could not read the guard permissions.', error);
        });
    };
    read();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') read();
    });
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return {
    isSupported: guardBridge.isSupported,
    granted,
    open: (permission) => {
      guardBridge.openPermissionSettings(permission).catch((error: unknown) => {
        if (__DEV__) console.warn('[focus] Could not open the settings page.', error);
      });
    },
  };
}
