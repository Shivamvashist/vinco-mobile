import * as Notifications from 'expo-notifications';

import { type NotificationPath, toNotificationPath } from '@/features/notifications';

import type { NotificationData } from './scheduler';

/** A tapped notification: where it leads, and which reminder it was (for usage counts later). */
export type NotificationTap = {
  /** The notification's id: the same tap is handled once. */
  id: string;
  path: NotificationPath;
  /** The reminder kind, or null for anything else (an admin broadcast later). */
  kind: string | null;
};

/**
 * The latest notification the user tapped, including the one that launched the app from closed
 * (a cold start). Null until there is one; actions other than a plain tap are ignored.
 */
export function useLastNotificationTap(): NotificationTap | null {
  const response = Notifications.useLastNotificationResponse();
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
  const { identifier, content } = response.notification.request;
  const data = (content.data ?? {}) as NotificationData;
  return {
    id: identifier,
    path: toNotificationPath(data.url),
    kind: typeof data.kind === 'string' ? data.kind : null,
  };
}

/** Forgets the latest tap, so reopening the app doesn't follow it again. */
export function clearNotificationTap(): void {
  try {
    Notifications.clearLastNotificationResponse();
  } catch (error) {
    if (__DEV__) console.warn('[notifications] Could not clear the last tap.', error);
  }
}
