import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { auroraBridge } from '@/features/aurora';
import { useGuardPermissions } from '@/hooks/useGuardPermissions';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

export type AppPermissionKey =
  'notifications' | 'camera' | 'microphone' | 'exactAlarm' | 'fullScreenAlarm' | 'accessibility' | 'overlay';

/** `unsupported`: the permission belongs to native code this build doesn't have (Expo Go). */
export type AppPermissionStatus = 'checking' | 'granted' | 'denied' | 'undetermined' | 'unsupported';

export type AppPermission = {
  status: AppPermissionStatus;
  /**
   * True while the phone can still show its own dialog. False once it can't (refused for good), and
   * always false for the native ones, which only a settings page can turn on.
   */
  canAsk: boolean;
  /** Shows the phone's dialog when it can, otherwise opens the right settings page. Never throws. */
  request: () => Promise<void>;
};

export type AppPermissions = {
  items: Record<AppPermissionKey, AppPermission>;
};

type Simple = { status: AppPermissionStatus; canAsk: boolean };
type AlarmAccess = { exact: boolean; fullScreen: boolean };

const CHECKING: Simple = { status: 'checking', canAsk: false };

/**
 * Every permission Vinco uses, read now and again whenever the app comes back to the foreground
 * (the user may have just changed one in the phone's settings). Shared by onboarding (reminders) and the
 * Permissions screen so the two never drift apart.
 */
export function useAppPermissions(): AppPermissions {
  const notifications = useNotificationPermission();
  const guard = useGuardPermissions();
  const [camera, requestCamera, getCamera] = useCameraPermissions();
  const [microphone, setMicrophone] = useState<Simple>(CHECKING);
  const [alarm, setAlarm] = useState<AlarmAccess | null>(null);

  useEffect(() => {
    let isMounted = true;
    const read = () => {
      getRecordingPermissionsAsync()
        .then((response) => isMounted && setMicrophone(toSimple(response)))
        .catch(() => isMounted && setMicrophone({ status: 'undetermined', canAsk: true }));
      if (auroraBridge.isSupported) {
        Promise.all([auroraBridge.canScheduleExact(), auroraBridge.canUseFullScreenIntent()])
          .then(([exact, fullScreen]) => isMounted && setAlarm({ exact, fullScreen }))
          .catch((error: unknown) => {
            if (__DEV__) console.warn('[permissions] Could not read the alarm access.', error);
          });
      }
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

  // The camera hook keeps its own state: ask it to read again on return to the app.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') getCamera().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [getCamera]);

  const notificationState: Simple = notifications.permission
    ? toSimple({
        granted: notifications.permission.status === 'granted',
        status: notifications.permission.status,
        canAskAgain: notifications.permission.canAskAgain,
      })
    : CHECKING;
  const cameraState: Simple = camera ? toSimple(camera) : CHECKING;

  const items: Record<AppPermissionKey, AppPermission> = {
    notifications: {
      ...notificationState,
      request: ask(notificationState.canAsk, async () => {
        await notifications.request();
      }),
    },
    camera: {
      ...cameraState,
      request: ask(cameraState.canAsk, async () => {
        await requestCamera();
      }),
    },
    microphone: {
      ...microphone,
      request: ask(microphone.canAsk, async () => {
        setMicrophone(toSimple(await requestRecordingPermissionsAsync()));
      }),
    },
    exactAlarm: native(auroraBridge.isSupported, alarm?.exact, () => auroraBridge.openExactAlarmSettings()),
    fullScreenAlarm: native(auroraBridge.isSupported, alarm?.fullScreen, () =>
      auroraBridge.openFullScreenIntentSettings(),
    ),
    accessibility: native(guard.isSupported, guard.granted?.accessibility, async () =>
      guard.open('accessibility'),
    ),
    overlay: native(guard.isSupported, guard.granted?.overlay, async () => guard.open('overlay')),
  };

  return { items };
}

/** A phone permission response in the list's terms. Android may still ask after one refusal. */
function toSimple(response: { granted: boolean; status?: unknown; canAskAgain: boolean }): Simple {
  if (response.granted) return { status: 'granted', canAsk: false };
  const status: AppPermissionStatus = response.status === 'denied' ? 'denied' : 'undetermined';
  return { status, canAsk: response.canAskAgain };
}

/** Asks with the dialog while it can; otherwise the app's page in the phone's settings. */
function ask(canAsk: boolean, showDialog: () => Promise<void>): () => Promise<void> {
  return async () => {
    try {
      if (canAsk) await showDialog();
      else await Linking.openSettings();
    } catch (error) {
      if (__DEV__) console.warn('[permissions] Could not ask for the permission.', error);
    }
  };
}

/** A permission only a settings page can grant, through the native bridge. */
function native(
  isSupported: boolean,
  isGranted: boolean | undefined,
  openSettings: () => Promise<void>,
): AppPermission {
  const status: AppPermissionStatus = !isSupported
    ? 'unsupported'
    : isGranted == null
      ? 'checking'
      : isGranted
        ? 'granted'
        : 'denied';
  return {
    status,
    canAsk: false,
    request: async () => {
      try {
        await openSettings();
      } catch (error) {
        if (__DEV__) console.warn('[permissions] Could not open the settings page.', error);
      }
    },
  };
}
