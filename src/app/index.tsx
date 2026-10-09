import { type Href, Redirect } from 'expo-router';

import { db, getActiveArc } from '@/db';
import { type OnboardingStep, useOnboardingStore } from '@/stores';

const STEP_HREFS: Record<OnboardingStep, Href> = {
  arc: '/onboarding/arc',
  orders: '/onboarding/orders',
  tone: '/onboarding/tone',
  oath: '/onboarding/oath',
  selfie: '/onboarding/selfie',
};

/**
 * Entry point. With an active arc: Today. Otherwise onboarding, resuming at the last step reached.
 * The database is already migrated here: the root layout waits for it.
 */
export default function Index() {
  const lastStep = useOnboardingStore((state) => state.lastStep);

  if (hasActiveArc()) return <Redirect href="/veni" />;
  return <Redirect href={lastStep ? STEP_HREFS[lastStep] : '/onboarding'} />;
}

/** A failed read sends the user to Today, never back through onboarding, so no arc is replaced. */
function hasActiveArc(): boolean {
  try {
    return getActiveArc(db) !== undefined;
  } catch (error) {
    if (__DEV__) console.warn('[index] Could not read the active arc.', error);
    return true;
  }
}
