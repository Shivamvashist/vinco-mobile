import type { AudioSource } from 'expo-audio';
import type { TextStyle } from 'react-native';

import type { motion } from './tokens/motion';
import type { radius } from './tokens/radius';
import type { layout, space } from './tokens/spacing';

/** Light or dark variant of a theme. */
export type SchemeName = 'dark' | 'light';

/** What the user picked. `system` follows the phone setting. */
export type ColorMode = SchemeName | 'system';

/**
 * Every colour role the app may use. Components ask for a role, never a hex value,
 * so a new theme only has to fill in this list.
 * Brand names for the default Vinco theme are noted in palettes/basalt.ts.
 */
export type ColorPalette = {
  background: string;
  /** Darker stage behind immersive screens (camera, milestone cards). */
  backgroundDeep: string;
  surface: string;
  surfaceSunk: string;
  surfaceRaised: string;

  border: string;
  /** Empty status rings, inactive milestones. */
  borderStrong: string;

  text: string;
  textMuted: string;
  /** Disabled labels, days not yet reached. */
  textFaint: string;

  /** Wins, full goal, primary actions. */
  accent: string;
  accentPressed: string;
  /** Icon tiles, minimum-held fills. */
  accentSoft: string;
  /** Minimum held: fill inside the status circle. */
  accentFill: string;
  /** Background of a selected card. */
  accentTint: string;
  /** Border of a row at full goal. */
  accentBorder: string;
  onAccent: string;

  /** Warnings, the reel counter, recording. */
  danger: string;
  dangerSoft: string;
  dangerBorder: string;

  /** Wax seal for the oath. */
  seal: string;
  onSeal: string;

  /** Denarii only. */
  currency: string;
  /** Truce (rest day). */
  rest: string;
  /** Sleep and neutral data. */
  info: string;
  /** Mission complete. */
  success: string;

  /** Behind bottom sheets. */
  scrim: string;
  /** Behind full-screen moments like the VINCO stamp. */
  overlay: string;

  /** Inverted chips: selected segment, toast. */
  inverse: string;
  onInverse: string;
};

export type ColorRole = keyof ColorPalette;

export type ColorScheme = {
  colors: ColorPalette;
  /** Status bar icon colour that reads on `background`. */
  statusBarStyle: 'light' | 'dark';
};

/** Font family names, chosen by weight. Android ignores fontWeight on custom fonts. */
export type FontFamilies = {
  display: string;
  body: string;
  bodyMedium: string;
  bodySemiBold: string;
  bodyBold: string;
};

export type FontSet = {
  families: FontFamilies;
  /** Passed to useFonts at start-up. Keys must match the family names. */
  assets: Record<string, number>;
};

export type TextVariant =
  | 'hero'
  | 'numeral'
  | 'display'
  | 'title'
  | 'heading'
  | 'headingSmall'
  | 'quote'
  | 'eyebrow'
  | 'bodyLarge'
  | 'body'
  | 'label'
  | 'labelSmall'
  | 'button'
  | 'caption'
  | 'overline'
  | 'micro';

export type TextVariantStyle = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'textTransform'
> & {
  /** Colour used when the caller doesn't pass one. */
  defaultColor: ColorRole;
  /** Cap for the phone's font-size setting, so big type never breaks a layout. */
  maxFontSizeMultiplier: number;
};

export type TypeScale = Record<TextVariant, TextVariantStyle>;

/** Every moment that can make a sound or a haptic. Names match the WAV files. */
export type FeedbackCue =
  | 'tap'
  | 'select'
  | 'toggle'
  | 'stepUp'
  | 'stepDown'
  | 'win'
  | 'stamp'
  | 'cross'
  | 'chime'
  | 'confirm'
  | 'recordStart'
  | 'recordStop'
  | 'shutter'
  | 'seal'
  | 'rise'
  | 'truce'
  | 'denied';

export type HapticPattern =
  'none' | 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export type FeedbackSet = {
  /** Master volume for this theme's sounds, 0 to 1. */
  volume: number;
  /** null means the cue is silent in this theme. */
  sounds: Record<FeedbackCue, AudioSource | null>;
  haptics: Record<FeedbackCue, HapticPattern>;
};

/** A complete core theme: both colour schemes plus fonts and feedback. */
export type ThemeDefinition = {
  id: string;
  name: string;
  schemes: Record<SchemeName, ColorScheme>;
  fonts: FontSet;
  feedback: FeedbackSet;
};

/** The resolved theme that components read through useTheme(). */
export type Theme = {
  id: string;
  name: string;
  scheme: SchemeName;
  colors: ColorPalette;
  statusBarStyle: ColorScheme['statusBarStyle'];
  fonts: FontFamilies;
  type: TypeScale;
  space: typeof space;
  radius: typeof radius;
  layout: typeof layout;
  motion: typeof motion;
};

export type ThemePreferences = {
  themeId: string;
  colorMode: ColorMode;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};
