import type { ColorPalette, SchemeName } from '@/theme';

/**
 * The colour roles the native guard's overlays use (modules/vigil VigilPalette): the card surface,
 * the hairline, the text, laurel gold for the one action, porphyry for Imperium's countdown.
 */
export const FOCUS_OVERLAY_ROLES = [
  'background',
  'surface',
  'surfaceRaised',
  'border',
  'borderStrong',
  'text',
  'textMuted',
  'textFaint',
  'accent',
  'onAccent',
  'danger',
  'scrim',
] as const satisfies readonly (keyof ColorPalette)[];

export type FocusOverlayRole = (typeof FOCUS_OVERLAY_ROLES)[number];
export type FocusOverlayColors = Record<FocusOverlayRole, string>;

/** The overlays' look: the active palette's roles and its scheme. */
export type FocusOverlayTheme = { scheme: SchemeName; colors: FocusOverlayColors };

/**
 * Picks the overlay roles from the active theme, so the windows over other apps match the palette
 * the user chose (Basalt, Nox, Marble...). The native side keeps Basalt for anything missing.
 */
export function focusOverlayTheme(theme: { scheme: SchemeName; colors: ColorPalette }): FocusOverlayTheme {
  const colors = {} as FocusOverlayColors;
  for (const role of FOCUS_OVERLAY_ROLES) colors[role] = theme.colors[role];
  return { scheme: theme.scheme, colors };
}
