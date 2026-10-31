import { useEffect, useEffectEvent, useRef } from 'react';

import { todayCopy } from '@/copy';
import type { DayKey } from '@/lib/dates';

export type DenariiMessage = { amount: number; text: string };

/**
 * Says so when today's live pay changes while Today is open: "+15 denarii" when the day holds,
 * a quiet note when an undo takes them back. Silent on first load and when the day turns over.
 * @param todayEarned denarii paid live for today (useCampaign)
 */
export function useDenariiToast(
  todayEarned: number,
  isLoaded: boolean,
  today: DayKey,
  onMessage: (message: DenariiMessage) => void,
): void {
  const last = useRef<{ day: DayKey; amount: number } | null>(null);
  const notify = useEffectEvent(onMessage);

  useEffect(() => {
    if (!isLoaded) return;
    const previous = last.current;
    last.current = { day: today, amount: todayEarned };
    if (!previous || previous.day !== today || previous.amount === todayEarned) return;
    const change = todayEarned - previous.amount;
    notify({
      amount: change,
      text: change > 0 ? todayCopy.denariiToast.paid(change) : todayCopy.denariiToast.takenBack(-change),
    });
  }, [todayEarned, isLoaded, today]);
}
