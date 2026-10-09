import { router } from 'expo-router';

import { clearJourney, db } from '@/db';
import { deleteAllMedia } from '@/media';
import { useDevStore, useNoticesStore, useOnboardingStore, usePreferencesStore } from '@/stores';

/**
 * journey: ends the arc and deletes every record, selfie and the oath. Preferences stay.
 * everything (dev mode): the journey, plus preferences and the simulated clock.
 */
export type ResetScope = 'journey' | 'everything';

/**
 * Wipes the journey and returns to the Rubicon. The database is cleared first, in one
 * transaction: if that fails it throws and nothing else is touched, so the caller can
 * say so and the user keeps everything.
 */
export function useResetJourney(): (scope: ResetScope) => void {
  return (scope) => {
    clearJourney(db);
    deleteAllMedia();
    useOnboardingStore.getState().reset();
    useNoticesStore.getState().reset();
    if (scope === 'everything') {
      usePreferencesStore.getState().reset();
      useDevStore.getState().resetDayOffset();
    }
    // Replace, so Back can't return to the old journey's tabs.
    router.replace('/onboarding');
  };
}
