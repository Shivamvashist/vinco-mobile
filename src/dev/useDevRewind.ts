/**
 * DEV ONLY: moves the simulated clock back, safely. The database rewind runs first, in one
 * transaction; only when it succeeds do the selfies go, a removed focus lift its guard, and the
 * clock move. When it throws, nothing has changed and the caller says so.
 */
import { db } from '@/db';
import { guardBridge } from '@/features/guard';
import { deleteMediaFile } from '@/media';
import { cancelFocusHeld } from '@/notifications';
import { useDevStore, useFocusUiStore } from '@/stores';

import { type RewindPlan, rewindJourney } from './rewind';

export function useDevRewind(): (plan: RewindPlan) => void {
  return (plan) => {
    const result = rewindJourney(db, plan.newToday);
    for (const path of result.selfiePaths) deleteMediaFile(path);
    if (result.removedRunningFocusId != null) {
      void cancelFocusHeld(result.removedRunningFocusId);
      guardBridge.endFocus().catch((error: unknown) => {
        console.warn('[dev] Could not lift the focus guard.', error);
      });
      useFocusUiStore.getState().reset();
    }
    // A plan steps back one day, or all the way to the real clock (planRewind).
    if (plan.offset === 0) useDevStore.getState().resetDayOffset();
    else useDevStore.getState().previousDay();
  };
}
