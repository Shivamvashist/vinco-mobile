import { useEffect } from 'react';

import { db, syncTodayAwards } from '@/db';
import type { OrderTargets } from '@/features/orders';
import type { DayKey } from '@/lib/dates';

/**
 * Pays today's denarii the moment today holds and takes them back when it stops holding,
 * whatever changed it: a tap, an edited or added order, the dev tools. Runs whenever today's
 * standing or the run before it can have changed. Writing the same rows again changes nothing.
 * @param todayStatus today's live standing (useCampaign)
 * @param runBefore the run up to yesterday, so a newly sealed day re-checks the streak pay
 */
export function useLiveAwards(
  hasArc: boolean,
  targets: OrderTargets,
  today: DayKey,
  todayStatus: 'open' | 'held' | 'conquered',
  runBefore: number,
  isLoaded: boolean,
): void {
  useEffect(() => {
    if (!isLoaded || !hasArc) return;
    try {
      db.transaction((tx) => {
        syncTodayAwards(tx, today, targets);
      });
    } catch (error) {
      // Runs again on the next change; the midnight seal writes the final pay regardless.
      if (__DEV__) console.warn("[denarii] Could not update today's pay.", error);
    }
    // targets is rebuilt each render; its content is captured by the status and the arc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasArc, today, todayStatus, runBefore, isLoaded]);
}
