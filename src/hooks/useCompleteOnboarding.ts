import { addCustomOrder, createArc, db, updateDayLog } from '@/db';
import { buildOrderTargets, DEFAULT_ORDER_TARGETS, type OrderTargets } from '@/features/orders';
import { toClockString } from '@/lib/dates';
import { type OnboardingDraft, useOnboardingStore } from '@/stores';

import { useToday } from './useToday';

/**
 * Finishes onboarding: turns the draft into the active arc in one transaction (Vinco's four for
 * a campaign, the picked ones for free training, then the user's own orders and the first
 * selfie), then clears the draft. Day I is today.
 * The returned function throws if saving fails; the draft is kept so the user can try again.
 */
export function useCompleteOnboarding(): (selfiePath: string | null) => void {
  const today = useToday();

  return (selfiePath) => {
    const draft = useOnboardingStore.getState();
    db.transaction((tx) => {
      const arcId = createArc(tx, {
        kind: draft.arcKind,
        lengthDays: draft.arcLength,
        startDay: today,
        wakeTime: toClockString(draft.wakeMinutes),
        targets: toArcTargets(draft),
        oathPath: draft.oathPath,
      });
      for (const order of draft.ownOrders) addCustomOrder(tx, arcId, order, today);
      if (selfiePath) updateDayLog(tx, today, { selfiePath });
    });
    draft.reset();
  };
}

/** A campaign has all four orders, tuned; free training has only the suggestions picked. */
function toArcTargets(draft: OnboardingDraft): OrderTargets {
  if (draft.arcKind === 'campaign') return buildOrderTargets(draft.fullGoals);
  const targets: OrderTargets = {};
  for (const pick of draft.picks) targets[pick] = DEFAULT_ORDER_TARGETS[pick];
  return targets;
}
