import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { focusCopy } from '@/copy';
import {
  db,
  FocusError,
  type FocusRetreat,
  type FocusSessionRow,
  retreatFocus,
  selectFocusOn,
  selectLatestFocus,
  settleFocus,
  startFocus,
} from '@/db';
import {
  type ClockAnchor,
  expectedFocusReward,
  type FocusGuard,
  getFocusState,
  getTrustedNow,
  remainingMs,
} from '@/features/focus';
import { guardBridge } from '@/features/guard';
import type { DayKey } from '@/lib/dates';
import { cancelFocusHeld, scheduleFocusHeld } from '@/notifications';
import { useFocusUiStore, usePreferencesStore } from '@/stores';

import { useToday } from './useToday';

/** A tick lands this long after the second turns, so the clock never shows the old second. */
const TICK_LEAD_MS = 20;

/**
 * When this app process started. A focus that finished after it (here, or while the app was closed
 * and settled on opening) shows its result once; older ones are history.
 */
const APP_OPENED_AT = new Date().toISOString();

export type FocusStartResult = 'started' | 'busy' | 'failed';

/** What a retreat did: given up (paid), waiting on the stand-down, nothing running, or an error. */
export type FocusRetreatResult = FocusRetreat['status'] | 'failed';

export type FocusController = {
  /** False until the sessions have been read once. */
  isLoaded: boolean;
  today: DayKey;
  /** The focus running now, or null. */
  running: FocusSessionRow | null;
  /** Milliseconds left on the running focus (0 when none). Ticks on the second while one runs. */
  remainingMs: number;
  /** Focus sessions already paid today (at most three are). */
  rewardedToday: number;
  /** A focus that finished (held or given up) since the app opened, until the user has seen it. */
  settled: FocusSessionRow | null;
  /** `allowedPackages`: the Comites and the Phone app, passed to the native guard. */
  start: (minutes: number, guard: FocusGuard, allowedPackages: readonly string[]) => FocusStartResult;
  /** Gives up the running focus, paid with a Truce or denarii, or after the stand-down. Never pays. */
  retreat: (options?: { afterStandDown?: boolean }) => FocusRetreatResult;
  /** The settled result was seen (claimed or dismissed): it won't open again. */
  dismissSettled: () => void;
};

/**
 * The focus ("Acies"), live from SQLite: the running session, a clock that ticks only while one
 * runs, and settling (paying) it the moment its time is up, also when the app comes back to the
 * foreground or opens after being closed. The rules are in src/features/focus.
 */
export function useFocus(): FocusController {
  const today = useToday();
  const tone = usePreferencesStore((state) => state.tone);
  const seenSessionId = useFocusUiStore((state) => state.seenSessionId);
  const markSeen = useFocusUiStore((state) => state.markSeen);
  const latestRows = useLiveQuery(selectLatestFocus(db));
  const todayRows = useLiveQuery(selectFocusOn(db, today), [today]);
  const [now, setNow] = useState(() => new Date());
  // Wall and monotonic clocks read together when this focus began; dropped when the app leaves the
  // foreground (the monotonic clock may pause while the phone sleeps).
  const anchor = useRef<(ClockAnchor & { sessionId: number }) | null>(null);

  const latest = latestRows.data[0] ?? null;
  const running = latest?.status === 'running' ? latest : null;
  const runningId = running?.id ?? null;
  const runningEndsAt = running?.endsAt ?? null;
  const settled =
    latest &&
    latest.status !== 'running' &&
    latest.endedAt != null &&
    latest.endedAt >= APP_OPENED_AT &&
    latest.id !== seenSessionId
      ? latest
      : null;
  const rewardedToday = todayRows.data.filter((row) => row.reward > 0).length;

  // The clock ticks on the second, only while a focus runs.
  useEffect(() => {
    if (runningEndsAt == null) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      const left = remainingMs({ endsAt: runningEndsAt }, new Date());
      const wait = left > 0 ? (left % 1000 || 1000) + TICK_LEAD_MS : 1000;
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, wait);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [runningEndsAt]);

  // Back in the foreground: read the clock again (and settle below if the time is up).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
      else anchor.current = null;
    });
    return () => subscription.remove();
  }, []);

  // Settle the moment the time is up, judged by the trusted clock.
  useEffect(() => {
    if (!running) return;
    const sessionAnchor = anchor.current?.sessionId === running.id ? anchor.current : null;
    const trusted = getTrustedNow(now, sessionAnchor, performance.now());
    if (getFocusState(running, trusted) !== 'due') return;
    try {
      const done = settleFocus(db, trusted);
      if (done) {
        void cancelFocusHeld(done.id);
        void guardBridge.endFocus().catch(warnBridge);
      }
    } catch (error) {
      // Kept running: the next tick tries again, and nothing was paid.
      if (__DEV__) console.warn('[focus] Could not settle the focus.', error);
    }
  }, [running, now]);

  const start = (
    minutes: number,
    guard: FocusGuard,
    allowedPackages: readonly string[],
  ): FocusStartResult => {
    try {
      const startedAt = new Date();
      const session = startFocus(db, { day: today, guard, minutes }, startedAt);
      anchor.current = { wallMs: startedAt.getTime(), monotonicMs: performance.now(), sessionId: session.id };
      setNow(startedAt);
      const endsAt = new Date(session.endsAt);
      void scheduleFocusHeld({
        sessionId: session.id,
        endsAt,
        title: focusCopy.notification.title,
        body: focusCopy.notification.body(expectedFocusReward(session.minutes, guard, rewardedToday), tone),
      });
      // The native side always adds Vinco, calls and emergency to the allowed list.
      void guardBridge
        .startFocus({ guard, startedAt, endsAt, allowedPackages, copy: focusCopy.overlay })
        .catch(warnBridge);
      return 'started';
    } catch (error) {
      if (error instanceof FocusError && error.reason === 'busy') return 'busy';
      if (__DEV__) console.warn('[focus] Could not start the focus.', error);
      return 'failed';
    }
  };

  const retreat = ({ afterStandDown = false }: { afterStandDown?: boolean } = {}): FocusRetreatResult => {
    if (runningId == null) return 'none';
    try {
      const result = retreatFocus(db, runningId, new Date(), { afterStandDown });
      if (result.status === 'retreated') {
        anchor.current = null;
        void cancelFocusHeld(result.session.id);
        void guardBridge.endFocus().catch(warnBridge);
      }
      return result.status;
    } catch (error) {
      if (__DEV__) console.warn('[focus] Could not retreat from the focus.', error);
      return 'failed';
    }
  };

  return {
    isLoaded: latestRows.updatedAt != null,
    today,
    running,
    remainingMs: running ? remainingMs(running, now) : 0,
    rewardedToday,
    settled,
    start,
    retreat,
    dismissSettled: () => {
      if (settled) markSeen(settled.id);
    },
  };
}

function warnBridge(error: unknown): void {
  if (__DEV__) console.warn('[focus] The guard bridge failed.', error);
}
