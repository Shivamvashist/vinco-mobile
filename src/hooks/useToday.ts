import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { msUntilNextLocalMidnight, toDayKey, type DayKey } from '@/lib/dates';

/** Re-check at least this often, so a time zone or clock change is picked up while open. */
const MAX_CHECK_INTERVAL_MS = 30 * 60 * 1000;
/** Fire just after midnight, never just before it. */
const MIDNIGHT_BUFFER_MS = 1000;

/**
 * Today's local calendar day. Updates at midnight while the app is open, and whenever
 * the app comes back to the foreground (the phone may have slept past midnight, or
 * travelled to another time zone).
 */
export function useToday(): DayKey {
  const [today, setToday] = useState<DayKey>(() => toDayKey(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      // Same string as before means React skips the re-render.
      setToday(toDayKey(new Date()));
      schedule();
    };

    const schedule = () => {
      clearTimeout(timer);
      const wait = Math.min(msUntilNextLocalMidnight(new Date()) + MIDNIGHT_BUFFER_MS, MAX_CHECK_INTERVAL_MS);
      timer = setTimeout(refresh, wait);
    };

    schedule();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return today;
}
