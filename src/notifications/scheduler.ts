import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { notificationsCopy } from '@/copy';
import { REMINDER_ID_PREFIX, type ReminderKind } from '@/features/notifications';

/**
 * The only place Vinco talks to expo-notifications for local reminders. Screens and hooks call these;
 * the plan itself is made by the pure planner in src/features/notifications.
 */

/** Android notification channels. 'aurora' (the alarm) is created by the native Aurora module. */
export const NOTIFICATION_CHANNELS = { reminders: 'reminders', announcements: 'announcements' } as const;

/** One reminder, worded and ready to schedule. */
export type ReminderToSchedule = {
  id: string;
  kind: ReminderKind;
  fireAt: Date;
  title: string;
  body: string;
  url: string;
};

/** Data carried by every notification Vinco shows, read back when it is tapped. */
export type NotificationData = { kind?: unknown; url?: unknown; type?: unknown; notificationId?: unknown };

let setupPromise: Promise<void> | null = null;

/**
 * Sets how notifications show while the app is open, and creates the Android channels. Runs once;
 * safe to call again. A channel's importance is fixed by Android once created: change it only with a
 * new channel id.
 */
export function setUpNotifications(): Promise<void> {
  setupPromise ??= (async () => {
    // The user is already in the app: list it quietly, no banner over the screen, no sound.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS !== 'android') return;
    const { channels } = notificationsCopy;
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.reminders, {
      name: channels.reminders.name,
      description: channels.reminders.description,
      importance: Notifications.AndroidImportance.DEFAULT,
      // Nothing personal is in the text, but the lock screen still shows only that one arrived.
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.announcements, {
      name: channels.announcements.name,
      description: channels.announcements.description,
      importance: Notifications.AndroidImportance.LOW,
    });
  })().catch((error: unknown) => {
    setupPromise = null;
    if (__DEV__) console.warn('[notifications] Setup failed.', error);
  });
  return setupPromise;
}

/** Cancels every reminder Vinco scheduled, and nothing else (Aurora and pushes are not ours to touch). */
export async function cancelReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(REMINDER_ID_PREFIX))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

/** Replaces Vinco's scheduled reminders with this plan. */
export async function replaceReminders(plan: readonly ReminderToSchedule[]): Promise<void> {
  await setUpNotifications();
  await cancelReminders();
  for (const reminder of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { kind: reminder.kind, url: reminder.url },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.fireAt,
        channelId: NOTIFICATION_CHANNELS.reminders,
      },
    });
  }
}
