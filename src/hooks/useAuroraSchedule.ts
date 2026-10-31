import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { auroraCopy, pickTone } from '@/copy';
import {
  type AuroraBridge,
  auroraBridge,
  type AuroraNotice,
  type AuroraPlan,
  type AuroraSettings,
  isSamePlan,
  planAuroraRing,
} from '@/features/aurora';
import type { Tone } from '@/features/tone';
import { useGuardStore, usePreferencesStore } from '@/stores';

const ALARM_PATH = '/alarm';

/** The notification text in the user's tone. */
export function auroraNotice(tone: Tone): AuroraNotice {
  const notice = auroraCopy.notice;
  return {
    channelName: notice.channelName,
    title: notice.title,
    body: pickTone(notice.body, tone),
    action: notice.action,
    timedOutTitle: notice.timedOutTitle,
    timedOutBody: notice.timedOutBody,
  };
}

/** Sends a plan to the phone's alarm. */
export async function applyAuroraPlan(bridge: AuroraBridge, plan: AuroraPlan, tone: Tone): Promise<void> {
  if (plan.kind === 'cancel') return bridge.cancel();
  return bridge.schedule(plan.ringAt, auroraNotice(tone), {
    minutes: plan.minutes,
    daysMask: plan.daysMask,
  });
}

type Sent = { plan: AuroraPlan; tone: Tone };

/**
 * Keeps the phone's alarm in step with the Aurora settings: schedules the next ring when they
 * change or the app comes back, cancels when Aurora is off, and opens the ring screen whenever
 * Aurora is ringing. Mount once (the tabs layout). Does nothing in Expo Go.
 */
export function useAuroraSchedule(): void {
  const settings = useGuardStore((state) => state.aurora);
  const tone = usePreferencesStore((state) => state.tone);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const sentRef = useRef<Sent | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!auroraBridge.isSupported) return;
    const openRingScreen = () => {
      if (pathnameRef.current !== ALARM_PATH) router.push(ALARM_PATH);
    };
    const sync = () => {
      syncAurora(settings, tone, sentRef).catch((error: unknown) => {
        if (__DEV__) console.warn('[aurora] Could not set the alarm.', error);
      });
      auroraBridge
        .isRinging()
        .then((isRinging) => isRinging && openRingScreen())
        .catch(() => undefined);
    };
    sync();
    const appState = AppState.addEventListener('change', (state) => state === 'active' && sync());
    const stopListening = auroraBridge.onRing(openRingScreen);
    return () => {
      appState.remove();
      stopListening();
    };
  }, [settings, tone]);
}

/**
 * Sends the plan when it differs from the last one sent, or when the phone has lost its ring
 * (an app update can clear alarms). A pending dev test ring is left alone.
 */
async function syncAurora(
  settings: AuroraSettings,
  tone: Tone,
  sentRef: { current: Sent | null },
): Promise<void> {
  const plan = planAuroraRing(settings, new Date());
  const last = sentRef.current;
  const isUnchanged = last != null && last.tone === tone && isSamePlan(last.plan, plan);
  if (isUnchanged && (plan.kind === 'cancel' || (await auroraBridge.getNextRing()) != null)) return;
  await applyAuroraPlan(auroraBridge, plan, tone);
  sentRef.current = { plan, tone };
}
