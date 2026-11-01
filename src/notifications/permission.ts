import * as Notifications from 'expo-notifications';

import { setUpNotifications } from './scheduler';

/** The notification permission as the app's screens show it. */
export type NotificationPermission = {
  status: 'granted' | 'denied' | 'undetermined';
  /** False once Android will no longer show the dialog: then only the phone's settings can allow it. */
  canAskAgain: boolean;
};

const UNKNOWN: NotificationPermission = { status: 'undetermined', canAskAgain: true };

/** Reads the permission without asking. Failures read as "not asked yet". */
export async function readNotificationPermission(): Promise<NotificationPermission> {
  try {
    return toPermission(await Notifications.getPermissionsAsync());
  } catch (error) {
    if (__DEV__) console.warn('[notifications] Could not read the permission.', error);
    return UNKNOWN;
  }
}

/**
 * Shows Android's notification dialog (Android 13 and later; older phones allow by default).
 * The channels are made first: Android 13 may skip the dialog for an app with none yet (a fresh
 * install). Returns the permission afterwards; failures read as "not allowed".
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  try {
    await setUpNotifications();
    return toPermission(await Notifications.requestPermissionsAsync());
  } catch (error) {
    if (__DEV__) console.warn('[notifications] Could not ask for the permission.', error);
    return { status: 'denied', canAskAgain: false };
  }
}

function toPermission(response: Notifications.NotificationPermissionsStatus): NotificationPermission {
  const status = response.granted ? 'granted' : response.status === 'denied' ? 'denied' : 'undetermined';
  return { status, canAskAgain: response.canAskAgain };
}
