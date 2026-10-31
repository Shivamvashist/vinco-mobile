import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import * as Notifications from 'expo-notifications';

/**
 * Fetches this install's Expo push token, for admin broadcasts later (docs/NOTIFICATIONS.md).
 * Only in a development or production build: Expo Go on Android has no push since SDK 53.
 * Returns null on any failure (offline, FCM not set up yet, no project id). Never sent anywhere yet:
 * the caller stores it on the phone until the app is wired to `PUT /v1/installs/me/push`.
 */
export async function fetchExpoPushToken(): Promise<string | null> {
  if (isRunningInExpoGo()) return null;
  const projectId = readProjectId();
  if (!projectId) return null;
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return null;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return typeof token.data === 'string' && token.data.length > 0 ? token.data : null;
  } catch (error) {
    // Expected until the Firebase (FCM) credentials are set up in EAS.
    if (__DEV__) console.warn('[notifications] No push token yet.', error);
    return null;
  }
}

function readProjectId(): string | null {
  const extra: unknown = Constants.expoConfig?.extra;
  const eas =
    extra != null && typeof extra === 'object' ? (extra as { eas?: { projectId?: unknown } }).eas : null;
  const id = eas?.projectId ?? Constants.easConfig?.projectId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}
