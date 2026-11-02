import { Pedometer } from 'expo-sensors';
import { useEffect, useState } from 'react';

import {
  AURORA_RULES,
  EMPTY_STEP_TALLY,
  MARCH_RULES,
  marchLeft,
  type MissionFallback,
  type MissionMode,
  type MissionRun,
  tallySteps,
} from '@/features/aurora';

/**
 * Aurora's march: 30 steps from the phone's step counter.
 *
 * The permission ("Physical activity") is never asked here: over the lock screen Android's dialog
 * can open behind the lock, and the march would wait for an answer that never comes. It is asked
 * ahead, on the Aurora screen. Here it is only read. With no step counter, no permission, no
 * answer within 4 seconds, or no step for 20 seconds, the march counts taps on a big button
 * instead (steps still add), so the alarm can always be stopped. After a minute the tap way through
 * is offered anyway.
 */
export function useMarch(): MissionRun {
  const goal = AURORA_RULES.marchSteps;
  const [mode, setMode] = useState<MissionMode>('checking');
  const [fallback, setFallback] = useState<MissionFallback | null>(null);
  const [tally, setTally] = useState(EMPTY_STEP_TALLY);
  const [taps, setTaps] = useState(0);
  const [isOffered, setIsOffered] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let hasSettled = false;
    let subscription: { remove: () => void } | null = null;
    const settle = (next: MissionMode, why: MissionFallback | null) => {
      if (isCancelled || hasSettled) return;
      hasSettled = true;
      setMode(next);
      setFallback(why);
    };
    const checkTimer = setTimeout(() => settle('taps', 'noSensor'), MARCH_RULES.checkTimeoutMs);
    const start = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (isCancelled) return;
      if (!isAvailable) return settle('taps', 'noSensor');
      const permission = await Pedometer.getPermissionsAsync();
      if (isCancelled) return;
      if (!permission.granted) return settle('taps', 'noPermission');
      const startedAt = Date.now();
      subscription = Pedometer.watchStepCount((result) => {
        if (!isCancelled) setTally((current) => tallySteps(current, result.steps, Date.now() - startedAt));
      });
      // A late answer still counts steps, even if the button already took over.
      settle('sensor', null);
    };
    start().catch((error: unknown) => {
      if (__DEV__) console.warn('[aurora] The step counter could not start.', error);
      settle('taps', 'noSensor');
    });
    return () => {
      isCancelled = true;
      clearTimeout(checkTimer);
      subscription?.remove();
    };
  }, []);

  // A step counter that reports nothing at all: let the user tap instead.
  const steps = tally.steps;
  useEffect(() => {
    if (mode !== 'sensor' || steps > 0) return;
    const timer = setTimeout(() => {
      setMode('taps');
      setFallback('quiet');
    }, MARCH_RULES.noStepsFallbackMs);
    return () => clearTimeout(timer);
  }, [mode, steps]);

  // Steps arriving but slowly (or a user who can't walk): offer the tap way through after a minute.
  useEffect(() => {
    if (mode !== 'sensor') return;
    const timer = setTimeout(() => setIsOffered(true), MARCH_RULES.tapOfferMs);
    return () => clearTimeout(timer);
  }, [mode]);

  const count = Math.min(goal, mode === 'taps' ? steps + taps : steps);
  const left = marchLeft(count);
  return {
    kind: 'march',
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
