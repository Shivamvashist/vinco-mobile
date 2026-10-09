/**
 * App and UI state (Zustand), saved on the phone.
 * Records (tasks, days, logs) are NOT stored here: they live in SQLite and are read
 * with Drizzle live queries from Step 7.
 */
export { DEFAULT_PREFERENCES, type Preferences } from './preferences';
export { selectThemePreferences, usePreferencesStore, type PreferencesStore } from './preferencesStore';
export {
  DEFAULT_ONBOARDING_DRAFT,
  ONBOARDING_STEPS,
  type OnboardingDraft,
  type OnboardingStep,
  type OnboardingStore,
  sanitizeOnboardingDraft,
  useOnboardingStore,
} from './onboardingStore';
export { type NoticesStore, sanitizeNotices, useNoticesStore } from './noticesStore';
