import type { ThemeDefinition, ThemePreferences } from '../types';
import { vincoTheme } from './vinco';

/**
 * Every core theme the app can switch to. To add a theme:
 * 1. Create themes/<name>.ts exporting a ThemeDefinition (both schemes, fonts, feedback).
 * 2. Add it to this list.
 * Fonts for every listed theme are loaded at start-up.
 */
export const THEMES: readonly ThemeDefinition[] = [vincoTheme];

export const DEFAULT_THEME_ID = vincoTheme.id;

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  themeId: DEFAULT_THEME_ID,
  colorMode: 'dark',
  soundEnabled: true,
  hapticsEnabled: true,
};

/** Returns the theme with this id, or the default theme if the id is unknown. */
export function getThemeDefinition(themeId: string): ThemeDefinition {
  const found = THEMES.find((theme) => theme.id === themeId);
  if (found) return found;
  if (__DEV__) console.warn(`[theme] Unknown theme "${themeId}", using "${DEFAULT_THEME_ID}".`);
  return vincoTheme;
}

/** All font assets across all themes, for a single useFonts call. */
export function getAllFontAssets(): Record<string, number> {
  return THEMES.reduce<Record<string, number>>((assets, theme) => ({ ...assets, ...theme.fonts.assets }), {});
}
