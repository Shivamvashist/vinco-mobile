import * as Notifications from 'expo-notifications';

import { FOCUS_NOTIFICATION_ID_PREFIX } from '@/features/focus';

import { NOTIFICATION_CHANNELS, setUpNotifications } from './scheduler';

/**
 * The "Focus held" notification, fired when a focus ends. Its id starts with 'vinco.focus.', never
 * with the reminders' prefix, so rewriting the reminder plan never cancels it.
 */

/** The notification id for a focus session. */
export function focusNotificationId(sessionId: number): string {
  return `${FOCUS_NOTIFICATION_ID_PREFIX}${sessionId}`;
}

export type FocusNotification = { sessionId: number; endsAt: Date; title: string; body: string };

/** Schedules "Focus held" at the session's end. Fails quietly: the focus itself never depends on it. */
export async function scheduleFocusHeld({
  sessionId,
  endsAt,
  title,
  body,
}: FocusNotification): Promise<void> {
  if (!(endsAt.getTime() > Date.now())) return;
  try {
    await setUpNotifications();
    await Notifications.scheduleNotificationAsync({
      identifier: focusNotificationId(sessionId),
      content: { title, body, data: { kind: 'focus', url: '/veni' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: endsAt,
        channelId: NOTIFICATION_CHANNELS.reminders,
      },
    });
  } catch (error) {
    if (__DEV__) console.warn('[notifications] Could not schedule the focus notification.', error);
  }
}

/** Cancels a focus's notification (given up, or settled in the app before it fired). */
export async function cancelFocusHeld(sessionId: number): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(focusNotificationId(sessionId));
  } catch (error) {
    if (__DEV__) console.warn('[notifications] Could not cancel the focus notification.', error);
  }
}
