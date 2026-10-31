import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  type NotificationPermission,
  readNotificationPermission,
  requestNotificationPermission,
} from '@/notifications';
import { useRemindersStore } from '@/stores';

export type NotificationPermissionState = {
  /** Null while the first read is in flight. */
  permission: NotificationPermission | null;
  /** Shows Android's dialog when it still can. Returns the permission afterwards. */
  request: () => Promise<NotificationPermission>;
};

/** The notification permission, read again whenever the user comes back from the phone's settings. */
export function useNotificationPermission(): NotificationPermissionState {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const markPermissionAsked = useRemindersStore((state) => state.markPermissionAsked);

  useEffect(() => {
    let isMounted = true;
    const read = () => {
      void readNotificationPermission().then((next) => {
        if (isMounted) setPermission(next);
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
    permission,
    request: async () => {
      markPermissionAsked();
      const next = await requestNotificationPermission();
      setPermission(next);
      return next;
    },
  };
}
