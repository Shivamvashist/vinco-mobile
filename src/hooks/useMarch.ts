import { Pedometer } from 'expo-sensors';
import { useEffect, useState } from 'react';

import { AURORA_RULES, marchLeft } from '@/features/aurora';

/** checking: asking for the step counter; steps: walking counts; taps: the button counts. */
export type MarchMode = 'checking' | 'steps' | 'taps';

export type March = {
  mode: MarchMode;
  /** Steps or taps counted so far. */
  count: number;
  left: number;
  isDone: boolean;
  /** One tap of the march button (taps mode only). */
  tap: () => void;
};

/** Steps that never arrive (a sleeping sensor) switch to taps after this long. */
const NO_STEPS_FALLBACK_MS = 20_000;

/**
 * Aurora's march: 30 steps from the phone's step counter. When there is no step counter, the
 * permission is refused, or no step arrives for 20 seconds, it counts taps on a big button
 * instead, so the alarm can always be stopped.
 */
export function useMarch(): March {
  const [mode, setMode] = useState<MarchMode>('checking');
  const [steps, setSteps] = useState(0);
  const [taps, setTaps] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let subscription: { remove: () => void } | null = null;
    const fallBack = () => {
      if (!isCancelled) setMode('taps');
    };
    const start = async () => {
      if (!(await Pedometer.isAvailableAsync())) return fallBack();
      const permission = await Pedometer.requestPermissionsAsync();
      if (!permission.granted || isCancelled) return fallBack();
      subscription = Pedometer.watchStepCount((result) => {
        if (!isCancelled) setSteps(Math.max(0, Math.floor(result.steps)));
      });
      setMode('steps');
    };
    start().catch(fallBack);
    return () => {
      isCancelled = true;
      subscription?.remove();
    };
  }, []);

  // A step counter that reports nothing at all: let the user tap instead.
  useEffect(() => {
    if (mode !== 'steps' || steps > 0) return;
    const timer = setTimeout(() => setMode('taps'), NO_STEPS_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [mode, steps]);

  // Steps already walked still count after a switch to taps.
  const count = mode === 'taps' ? steps + taps : steps;
  const left = marchLeft(count);
  return {
    mode,
    count,
    left,
    isDone: left === 0,
    tap: () => setTaps((value) => Math.min(value + 1, AURORA_RULES.marchSteps)),
  };
}
