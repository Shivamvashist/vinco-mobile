import { router } from 'expo-router';

import { clearRewardFlight } from '@/components/hud';
import { clearNotices } from '@/components/notices';
import { clearJourney, db, getRunningFocus } from '@/db';
import { guardBridge } from '@/features/guard';
import { deleteAllMedia } from '@/media';
import { cancelFocusHeld } from '@/notifications';
import {
  useDevStore,
  useFocusUiStore,
  useGuardStore,
  useNoticesStore,
  useOnboardingStore,
  usePreferencesStore,
} from '@/stores';

/**
 * journey: ends the arc and deletes every record, selfie and the oath. Preferences stay.
 * everything (dev mode): the journey, plus preferences, guard and alarm choices, and the simulated clock.
 */
export type ResetScope = 'journey' | 'everything';

/**
 * Wipes the journey and returns to the Rubicon (the first onboarding screen; the onboarding
 * draft is cleared first). The database is cleared first, in one transaction: if that fails
 * it throws and nothing else is touched, so the caller can say so and the user keeps everything.
 */
export function useResetJourney(): (scope: ResetScope) => void {
  return (scope) => {
    // A running focus goes with the journey: its "Focus held" notice must not fire afterwards.
    const running = getRunningFocus(db);
    clearJourney(db);
    if (running) {
      void cancelFocusHeld(running.id);
      // The native guard stops at its end on its own; lift it now, the focus is gone.
      guardBridge.endFocus().catch((error: unknown) => {
        if (__DEV__) console.warn('[reset] Could not lift the focus guard.', error);
      });
    }
    useFocusUiStore.getState().reset();
    // Nothing from the old journey keeps flying or talking over the first onboarding screen.
    clearRewardFlight();
    clearNotices();
    deleteAllMedia();
    useOnboardingStore.getState().reset();
    useNoticesStore.getState().reset();
    if (scope === 'everything') {
      usePreferencesStore.getState().reset();
      useGuardStore.getState().reset();
      useDevStore.getState().resetDayOffset();
    }
    // Close every screen above the tabs (Settings), then replace the tabs with the first
    // onboarding screen: Back can't return to the old journey, and the tabs (with the loss
    // notice) unmount instead of reading the cleared journey underneath.
    if (router.canDismiss()) router.dismissAll();
    router.replace('/onboarding');
  };
}
