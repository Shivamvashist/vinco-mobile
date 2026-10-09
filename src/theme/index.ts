/**
 * The design system's public API. Import theme things from '@/theme' only,
 * never from files inside this folder.
 */
export { themeEasing, themeTiming } from './animation';
export { createStyles } from './createStyles';
/** Re-applies the UI audio mode (quiet on silent, mixes with music). Call after recording. */
export { configureUiAudio as restoreUiAudioMode } from './feedback/soundBank';
export { useReduceMotion } from './ReduceMotionProvider';
export { SchemeOverride, ThemeProvider, useFeedback, useTheme, useThemeControls } from './ThemeProvider';
export { DEFAULT_THEME_PREFERENCES, getAllFontAssets, THEMES } from './themes/registry';
export { DAY_CARD_STYLES, type DayCardStyle } from './palettes/dayCards';
export { motion } from './tokens/motion';
export { radius } from './tokens/radius';
export { layout, space } from './tokens/spacing';
export type {
  ColorMode,
  ColorPalette,
  ColorRole,
  FeedbackCue,
  HapticPattern,
  SchemeName,
  TextVariant,
  Theme,
  ThemeDefinition,
  ThemePreferences,
} from './types';
