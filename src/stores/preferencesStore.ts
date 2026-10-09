import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Tone } from '@/features/tone';
import type { ThemePreferences } from '@/theme';

import { createPhoneStorage } from './phoneStorage';
import { DEFAULT_PREFERENCES, sanitizePreferences, type Preferences } from './preferences';

type PreferencesActions = {
  setTone: (tone: Tone) => void;
  updateThemePreferences: (patch: Partial<ThemePreferences>) => void;
};

export type PreferencesStore = Preferences & PreferencesActions;

/** Bump when the saved shape changes, and handle the old shape in `migrate`. */
const STORE_VERSION = 1;

/**
 * App and UI preferences, saved on the phone.
 * Not for records like tasks or days: those live in SQLite (Step 7) and are never copied here.
 */
export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      setTone: (tone) => set({ tone }),
      updateThemePreferences: (patch) => set(sanitizePreferences(patch)),
    }),
    {
      name: 'vinco.preferences',
      version: STORE_VERSION,
      storage: createPhoneStorage<Preferences>(),
      partialize: ({ tone, themeId, colorMode, soundEnabled, hapticsEnabled }) => ({
        tone,
        themeId,
        colorMode,
        soundEnabled,
        hapticsEnabled,
      }),
      // Older or unknown versions: keep whatever still validates.
      migrate: (saved) => ({ ...DEFAULT_PREFERENCES, ...sanitizePreferences(saved) }),
      merge: (saved, current) => ({ ...current, ...sanitizePreferences(saved) }),
      onRehydrateStorage: () => (_state, error) => {
        if (error && __DEV__) console.warn('[preferences] Could not restore, using defaults.', error);
      },
    },
  ),
);

/** The theme-related part, for ThemeProvider. Use with useShallow. */
export function selectThemePreferences(state: PreferencesStore): ThemePreferences {
  return {
    themeId: state.themeId,
    colorMode: state.colorMode,
    soundEnabled: state.soundEnabled,
    hapticsEnabled: state.hapticsEnabled,
  };
}
