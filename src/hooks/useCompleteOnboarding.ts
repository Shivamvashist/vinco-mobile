import { createArc, db, updateDayLog } from '@/db';
import { buildOrderTargets } from '@/features/orders';
import { toClockString } from '@/lib/dates';
import { useOnboardingStore } from '@/stores';

import { useToday } from './useToday';

/**
 * Finishes onboarding: turns the draft into the active arc (with its four orders and the first
 * selfie) in one transaction, then clears the draft. Day I is today.
 * The returned function throws if saving fails; the draft is kept so the user can try again.
 */
export function useCompleteOnboarding(): (selfiePath: string | null) => void {
  const today = useToday();

  return (selfiePath) => {
    const draft = useOnboardingStore.getState();
    db.transaction((tx) => {
      createArc(tx, {
        lengthDays: draft.arcLength,
        startDay: today,
        wakeTime: toClockString(draft.wakeMinutes),
        targets: buildOrderTargets(draft.fullGoals),
        oathPath: draft.oathPath,
      });
      if (selfiePath) updateDayLog(tx, today, { selfiePath });
    });
    draft.reset();
  };
}
