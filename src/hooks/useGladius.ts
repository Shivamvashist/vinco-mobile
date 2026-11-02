import { Accelerometer } from 'expo-sensors';
import { useEffect, useState } from 'react';

import {
  EMPTY_SWING_STATE,
  GLADIUS_RULES,
  gladiusLeft,
  type MissionFallback,
  type MissionMode,
  type MissionRun,
  readSwing,
  type SwingState,
} from '@/features/aurora';

/**
 * Aurora's "Gladius": swing the phone like a sword 30 times. Swings come from the accelerometer
 * (no permission needed), read by readSwing (src/features/aurora/gladius.ts). With no
 * accelerometer the button counts taps at once; after a minute without the 30 swings, a tap way
 * through is offered for anyone who can't swing (swings still add).
 */
export function useGladius(): MissionRun {
  const goal = GLADIUS_RULES.swings;
  const [mode, setMode] = useState<MissionMode>('checking');
  const [fallback, setFallback] = useState<MissionFallback | null>(null);
  const [swings, setSwings] = useState(0);
  const [taps, setTaps] = useState(0);
  const [isOffered, setIsOffered] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let hasSettled = false;
    let subscription: { remove: () => void } | null = null;
    // The detector's state lives here, off React: 50 readings a second, a render only per swing.
    let state: SwingState = EMPTY_SWING_STATE;
    const settle = (next: MissionMode, why: MissionFallback | null) => {
      if (isCancelled || hasSettled) return;
      hasSettled = true;
      setMode(next);
      setFallback(why);
    };
    const checkTimer = setTimeout(() => settle('taps', 'noSensor'), GLADIUS_RULES.checkTimeoutMs);
    const start = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (isCancelled) return;
      if (!isAvailable) return settle('taps', 'noSensor');
      Accelerometer.setUpdateInterval(GLADIUS_RULES.sampleIntervalMs);
      subscription = Accelerometer.addListener(({ x, y, z, timestamp }) => {
        if (isCancelled) return;
        // Android sends seconds since boot; anything odd falls back to the wall clock.
        const atMs = Number.isFinite(timestamp) && timestamp > 0 ? timestamp * 1000 : Date.now();
        const next = readSwing(state, { x, y, z, atMs });
        if (next.count !== state.count) setSwings(next.count);
        state = next;
      });
      settle('sensor', null);
    };
    start().catch((error: unknown) => {
      if (__DEV__) console.warn('[aurora] The accelerometer could not start.', error);
      settle('taps', 'noSensor');
    });
    return () => {
      isCancelled = true;
      clearTimeout(checkTimer);
      subscription?.remove();
    };
  }, []);

  // After a minute of swinging (or not), offer the tap way through.
  useEffect(() => {
    if (mode !== 'sensor') return;
    const timer = setTimeout(() => setIsOffered(true), GLADIUS_RULES.tapOfferMs);
    return () => clearTimeout(timer);
  }, [mode]);

  const count = Math.min(goal, mode === 'taps' ? swings + taps : swings);
  const left = gladiusLeft(count);
  return {
    kind: 'gladius',
    mode,
    fallback,
    count,
    goal,
    left,
    isDone: left === 0,
    canChooseTaps: isOffered && mode === 'sensor' && left > 0,
    chooseTaps: () => {
      setMode('taps');
      setFallback('chosen');
    },
    tap: () => setTaps((value) => Math.min(value + 1, goal)),
  };
}
