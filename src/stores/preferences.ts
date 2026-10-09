import { DEFAULT_TONE, isTone, type Tone } from '@/features/tone';
import { DEFAULT_THEME_PREFERENCES, THEMES, type ColorMode, type ThemePreferences } from '@/theme';

/** Everything the user chooses about how Vinco looks, sounds and talks. Saved on the phone. */
export type Preferences = ThemePreferences & {
  tone: Tone;
};

export const DEFAULT_PREFERENCES: Preferences = {
  ...DEFAULT_THEME_PREFERENCES,
  tone: DEFAULT_TONE,
};

const COLOR_MODES: readonly ColorMode[] = ['dark', 'light', 'system'];

/**
 * Keeps only the saved fields that are still valid. Anything missing, renamed
 * or corrupted falls back to the default, so a bad save can never break the app.
 */
export function sanitizePreferences(saved: unknown): Partial<Preferences> {
  if (saved == null || typeof saved !== 'object') return {};
  const value = saved as Record<string, unknown>;
  const clean: Partial<Preferences> = {};

  if (isTone(value.tone)) clean.tone = value.tone;
  // A theme that no longer exists (renamed or removed in an update) falls back to the default.
  if (typeof value.themeId === 'string' && THEMES.some((theme) => theme.id === value.themeId)) {
    clean.themeId = value.themeId;
  }
  if (COLOR_MODES.includes(value.colorMode as ColorMode)) clean.colorMode = value.colorMode as ColorMode;
  if (typeof value.soundEnabled === 'boolean') clean.soundEnabled = value.soundEnabled;
  if (typeof value.hapticsEnabled === 'boolean') clean.hapticsEnabled = value.hapticsEnabled;

  return clean;
}
