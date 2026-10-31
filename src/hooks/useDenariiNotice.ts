import { useEffect, useRef } from 'react';

import { notify } from '@/components/notices';
import { todayCopy } from '@/copy';
import type { DayKey } from '@/lib/dates';
import { useFeedback } from '@/theme';

/** One id, so a quick pay and take-back replace each other instead of queueing. */
const NOTICE_ID = 'denarii-today';

/**
 * Says so when today's live pay changes while Today is open: "+15 denarii" (a reward notice, with
 * the confirm cue) when the day holds, a quiet note when an undo takes them back. Silent on first
 * load and when the day turns over.
 * @param todayEarned denarii paid live for today (useCampaign)
 */
export function useDenariiNotice(todayEarned: number, isLoaded: boolean, today: DayKey): void {
  const play = useFeedback();
  const last = useRef<{ day: DayKey; amount: number } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const previous = last.current;
    last.current = { day: today, amount: todayEarned };
    if (!previous || previous.day !== today || previous.amount === todayEarned) return;
    const change = todayEarned - previous.amount;
    if (change > 0) {
      play('confirm');
      notify({ kind: 'reward', message: todayCopy.denariiNotice.paid(change), id: NOTICE_ID });
    } else {
      notify({ kind: 'info', message: todayCopy.denariiNotice.takenBack(-change), id: NOTICE_ID });
    }
  }, [todayEarned, isLoaded, today, play]);
}
