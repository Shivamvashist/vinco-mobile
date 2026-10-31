import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useRef } from 'react';

import { notificationsCopy, pickTone } from '@/copy';
import { db, selectDayLog, selectOrderLogsForDay, toOrderAmounts } from '@/db';
import { guardBridge, planWakeWatch, type WakeWatchConfig, type WakeWatchCopy } from '@/features/guard';
import type { Tone } from '@/features/tone';
import { usePreferencesStore, useRemindersStore } from '@/stores';

import { useActiveArc } from './useActiveArc';
import { useToday } from './useToday';

/** The "Are you up?" words in the user's tone. */
export function wakeWatchCopy(tone: Tone): WakeWatchCopy {
  const copy = notificationsCopy.wakePrompt;
  return {
    title: pickTone(copy.title, tone),
    body: pickTone(copy.body, tone),
    channelName: copy.channelName,
  };
}

/**
 * Keeps the native "Are you up?" watch in step: on while the arc has the wake-up order and
 * reminders are on; told the day wake-up was logged (a sick day counts), so the first unlock
 * after 3 am with nothing logged posts the prompt. Sends only when something changed. Mount once
 * (the tabs layout). Does nothing in Expo Go; the prompt itself needs the guard service.
 */
export function useWakeWatch(): void {
  const { arc, targets, isLoaded: isArcLoaded } = useActiveArc();
  const today = useToday();
  const orderLogs = useLiveQuery(selectOrderLogsForDay(db, today), [today]);
  const dayLog = useLiveQuery(selectDayLog(db, today), [today]);
  const remindersOn = useRemindersStore((state) => state.isOn);
  const tone = usePreferencesStore((state) => state.tone);
  const sentRef = useRef<string | null>(null);

  const isLoaded = isArcLoaded && orderLogs.updatedAt !== undefined && dayLog.updatedAt !== undefined;
  const log = dayLog.data[0];
  const plan = planWakeWatch({
    hasArc: arc != null,
    arcHasWake: targets.wake !== undefined,
    remindersOn,
    today,
    isWakeLogged: toOrderAmounts(orderLogs.data).wake > 0 || log?.wokeAt != null,
    isSickDay: log?.truceUsed === true,
  });
  const { enabled, awakeDay } = plan;

  useEffect(() => {
    // Until today's rows are read, "not logged" may just mean "not read yet".
    if (!guardBridge.isSupported || !isLoaded) return;
    const config: WakeWatchConfig = { enabled, awakeDay, copy: wakeWatchCopy(tone) };
    const key = JSON.stringify(config);
    if (sentRef.current === key) return;
    sentRef.current = key;
    guardBridge.setWakeWatch(config).catch((error: unknown) => {
      // Forget it so the next change (or launch) tries again.
      if (sentRef.current === key) sentRef.current = null;
      if (__DEV__) console.warn('[wake] Could not set the wake watch.', error);
    });
  }, [enabled, awakeDay, tone, isLoaded]);
}
