import { buildEffects } from './effects';
import { motion } from './tokens/motion';
import { radius } from './tokens/radius';
import { getTypeScale, scaleLayout, scaleSpace, scaleTypeScale } from './tokens/scale';
import { layout, space } from './tokens/spacing';
import { createTypeScale } from './tokens/typography';
import { DEFAULT_PALETTE_IDS, type Palette } from './palettes/registry';
import type { ColorMode, SchemeName, Theme, ThemeDefinition } from './types';

/** Fallback when the phone doesn't report a colour scheme. Vinco is dark by default. */
const FALLBACK_SCHEME: SchemeName = 'dark';

/**
 * Picks the scheme to show.
 * @param colorMode what the user chose
 * @param systemScheme what the phone reports (may be null, undefined or 'unspecified')
 */
export function resolveSchemeName(colorMode: ColorMode, systemScheme: string | null | undefined): SchemeName {
  if (colorMode === 'dark' || colorMode === 'light') return colorMode;
  if (systemScheme === 'dark' || systemScheme === 'light') return systemScheme;
  return FALLBACK_SCHEME;
}

/**
 * Builds the full theme object components read.
 * @param sizeScale from getSizeScale(window width): shrinks spacing, sizes and type on narrow phones
 * @param palette the user's palette for this scheme; without one (or for the other scheme), the
 *   theme's own scheme colours
 */
export function buildTheme(
  definition: ThemeDefinition,
  scheme: SchemeName,
  sizeScale = 1,
  palette?: Palette,
): Theme {
  const usesPalette = palette?.scheme === scheme;
  const colorScheme = usesPalette ? palette : definition.schemes[scheme];
  return {
    id: definition.id,
    name: definition.name,
    scheme,
    paletteId: usesPalette ? palette.id : DEFAULT_PALETTE_IDS[scheme],
    colors: colorScheme.colors,
    statusBarStyle: colorScheme.statusBarStyle,
    fonts: definition.fonts.families,
    type: scaleTypeScale(createTypeScale(definition.fonts.families), getTypeScale(sizeScale)),
    sizeScale,
    space: scaleSpace(space, sizeScale),
    radius,
    layout: scaleLayout(layout, sizeScale),
    motion,
    effects: buildEffects(colorScheme.colors, scheme),
  };
}
