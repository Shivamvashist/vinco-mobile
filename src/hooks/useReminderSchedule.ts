import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { notificationsCopy } from '@/copy';
import { arcEndDay } from '@/features/arc';
import {
  buildReminderDays,
  planReminders,
  type ReminderSettings,
  type ReminderSnapshot,
} from '@/features/notifications';
import { DEFAULT_WAKE_MINUTES } from '@/features/orders';
import type { Tone } from '@/features/tone';
import { parseClockMinutes, toDayKey } from '@/lib/dates';
import {
  cancelReminders,
  clearNotificationTap,
  fetchExpoPushToken,
  readNotificationPermission,
  replaceReminders,
  requestNotificationPermission,
  useLastNotificationTap,
} from '@/notifications';
import { selectReminderSettings, usePreferencesStore, useRemindersStore } from '@/stores';

import { useActiveArc } from './useActiveArc';
import { useCampaign } from './useCampaign';
import { useTodayOrders } from './useTodayOrders';

/** Wait for changes to settle (a burst of taps) before rewriting the plan. */
const REWRITE_DELAY_MS = 1500;

/** Rewrites run one at a time, in order, so two plans never interleave. */
let rewriteQueue: Promise<void> = Promise.resolve();
/** The push token is fetched at most once per app run. */
let hasFetchedPushToken = false;

/**
 * Keeps the phone's scheduled reminders matching the day (docs/NOTIFICATIONS.md): rewrites the plan
 * when today's standing, the arc, the settings, the tone or the day change, and when the app returns
 * to the foreground. Asks for the permission once, after onboarding. Follows tapped notifications.
 * Mount once, in the tabs layout.
 */
export function useReminderSchedule(): void {
  const { arc, targets, isLoaded: isArcLoaded } = useActiveArc();
  const orders = useTodayOrders(targets, arc?.id ?? null);
  const campaign = useCampaign(arc, targets, orders.today);
  const tone = usePreferencesStore((state) => state.tone);
  const settings = useRemindersStore(useShallow(selectReminderSettings));
  const hasAskedPermission = useRemindersStore((state) => state.hasAskedPermission);
  const [foregroundCount, setForegroundCount] = useState(0);

  const isReady = isArcLoaded && orders.isLoaded && campaign.isLoaded;
  const snapshot: ReminderSnapshot | null =
    arc && isReady
      ? {
          today: orders.today,
          isLudus: campaign.isLudus,
          startDay: arc.startDay,
          lastDay: campaign.isLudus ? null : arcEndDay(arc.startDay, arc.lengthDays),
          wakeMinutes: parseClockMinutes(arc.wakeTime) ?? DEFAULT_WAKE_MINUTES,
          totalCount: orders.totalCount,
          heldCount: orders.heldCount,
          hasAnyLog:
            orders.wokeAt != null ||
            Object.values(orders.amounts).some((amount) => amount > 0) ||
            orders.customOrders.some((item) => item.amount > 0),
          isHeld: campaign.todayStatus !== 'open',
          isSickDay: orders.isSickDay,
          campaign: campaign.campaign,
          truceOffer: campaign.truceOffer
            ? {
                days: campaign.truceOffer.days.length,
                campaignSaved: campaign.truceOffer.campaignSaved,
                canAfford: campaign.truceOffer.canAfford,
              }
            : null,
          truceReserve: campaign.truceReserve,
          denarii: campaign.denarii,
        }
      : null;
  // One string for everything the plan depends on: the effect reruns only when it really changes.
  const planKey = JSON.stringify({ snapshot, settings, tone, isReady });
  const latest = useRef({ snapshot, settings, tone });
  useEffect(() => {
    latest.current = { snapshot, settings, tone };
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setForegroundCount((count) => count + 1);
    });
    return () => subscription.remove();
  }, []);

  // Ask once, after onboarding: the first time the tabs open with an arc and reminders on.
  const shouldAsk = arc != null && settings.isOn && !hasAskedPermission;
  useEffect(() => {
    if (!shouldAsk) return;
    useRemindersStore.getState().markPermissionAsked();
    void readNotificationPermission()
      .then((current) =>
        current.status === 'undetermined' && current.canAskAgain ? requestNotificationPermission() : current,
      )
      .then(() => setForegroundCount((count) => count + 1));
  }, [shouldAsk]);

  useEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => {
      rewriteQueue = rewriteQueue
        .then(() => rewritePlan(latest.current))
        .catch((error: unknown) => {
          if (__DEV__) console.warn('[notifications] Could not update the reminders.', error);
        });
    }, REWRITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [planKey, foregroundCount, isReady]);

  useFollowNotificationTaps();
}

/** Opens the screen a tapped notification points to, once per tap (cold start included). */
function useFollowNotificationTaps(): void {
  const tap = useLastNotificationTap();
  const tapId = tap?.id ?? null;
  const tapPath = tap?.path ?? null;
  useEffect(() => {
    if (!tapId || !tapPath) return;
    clearNotificationTap();
    // TODO(backend Phase 4): record the usage event `reminder_opened { kind }` once events are sent.
    if (tapPath === '/veni') router.navigate(tapPath);
    else router.push(tapPath);
  }, [tapId, tapPath]);
}

type PlanState = {
  snapshot: ReminderSnapshot | null;
  settings: ReminderSettings;
  tone: Tone;
};

/** Cancels Vinco's reminders and schedules the current plan (or nothing, when off or not allowed). */
async function rewritePlan({ snapshot, settings, tone }: PlanState): Promise<void> {
  const permission = await readNotificationPermission();
  const now = new Date();
  // The dev clock can run ahead of the real day: then there is nothing real to remind about.
  const isRealDay = snapshot != null && snapshot.today === toDayKey(now);
  if (permission.status !== 'granted' || !settings.isOn || !snapshot || !isRealDay) {
    await cancelReminders();
    return;
  }
  const plan = planReminders({ settings, days: buildReminderDays(snapshot), now });
  await replaceReminders(
    plan.map((reminder) => ({
      id: reminder.id,
      kind: reminder.kind,
      fireAt: reminder.fireAt,
      url: reminder.url,
      ...notificationsCopy.reminder(reminder.message, tone),
    })),
  );
  if (!hasFetchedPushToken) {
    hasFetchedPushToken = true;
    const token = await fetchExpoPushToken();
    if (token) useRemindersStore.getState().setPushToken(token);
  }
}
