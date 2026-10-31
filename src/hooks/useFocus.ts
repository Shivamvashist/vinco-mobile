import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { focusCopy } from '@/copy';
import {
  abandonFocus,
  db,
  FocusError,
  type FocusSessionRow,
  selectFocusOn,
  selectLatestFocus,
  settleFocus,
  startFocus,
} from '@/db';
import {
  type ClockAnchor,
  expectedFocusReward,
  focusAllowanceMinutes,
  type FocusGuard,
  getFocusState,
  getTrustedNow,
  remainingMs,
} from '@/features/focus';
import { guardBridge } from '@/features/guard';
import type { DayKey } from '@/lib/dates';
import { cancelFocusHeld, scheduleFocusHeld } from '@/notifications';
import { usePreferencesStore } from '@/stores';

import { useToday } from './useToday';

/** A tick lands this long after the second turns, so the clock never shows the old second. */
const TICK_LEAD_MS = 20;

export type FocusStartResult = 'started' | 'busy' | 'failed';

export type FocusController = {
  today: DayKey;
  /** The focus running now, or null. */
  running: FocusSessionRow | null;
  /** Milliseconds left on the running focus (0 when none). Ticks on the second while one runs. */
  remainingMs: number;
  /** Focus sessions already paid today (at most three are). */
  rewardedToday: number;
  /** A focus that finished (held or given up) since the app opened, until dismissed. */
  settled: FocusSessionRow | null;
  start: (minutes: number, guard: FocusGuard) => FocusStartResult;
  /** Gives up the running focus. It pays nothing. */
  retreat: () => boolean;
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
  const latestRows = useLiveQuery(selectLatestFocus(db));
  const todayRows = useLiveQuery(selectFocusOn(db, today), [today]);
  // Read before `now`, so a focus settled on opening (the app was closed at its end) counts as new.
  const [openedAt] = useState(() => new Date().toISOString());
  const [now, setNow] = useState(() => new Date());
  const [dismissedId, setDismissedId] = useState<number | null>(null);
  // Wall and monotonic clocks read together when this focus began; dropped when the app leaves the
  // foreground (the monotonic clock may pause while the phone sleeps).
  const anchor = useRef<(ClockAnchor & { sessionId: number }) | null>(null);

  const latest = latestRows.data[0] ?? null;
  const running = latest?.status === 'running' ? latest : null;
  const runningId = running?.id ?? null;
  const runningEndsAt = running?.endsAt ?? null;
  const settled =
    latest && latest.status !== 'running' && latest.endedAt != null && latest.endedAt >= openedAt
      ? latest.id === dismissedId
        ? null
        : latest
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

  const start = (minutes: number, guard: FocusGuard): FocusStartResult => {
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
      void guardBridge
        .startFocus({ mode: guard, endsAt, allowanceMinutes: focusAllowanceMinutes(guard) })
        .catch(warnBridge);
      return 'started';
    } catch (error) {
      if (error instanceof FocusError && error.reason === 'busy') return 'busy';
      if (__DEV__) console.warn('[focus] Could not start the focus.', error);
      return 'failed';
    }
  };

  const retreat = (): boolean => {
    if (runningId == null) return false;
    try {
      const given = abandonFocus(db, runningId, new Date());
      if (!given) return false;
      anchor.current = null;
      void cancelFocusHeld(given.id);
      void guardBridge.endFocus().catch(warnBridge);
      return true;
    } catch (error) {
      if (__DEV__) console.warn('[focus] Could not give up the focus.', error);
      return false;
    }
  };

  return {
    today,
    running,
    remainingMs: running ? remainingMs(running, now) : 0,
    rewardedToday,
    settled,
    start,
    retreat,
    dismissSettled: () => {
      if (settled) setDismissedId(settled.id);
    },
  };
}

function warnBridge(error: unknown): void {
  if (__DEV__) console.warn('[focus] The guard bridge failed.', error);
}
