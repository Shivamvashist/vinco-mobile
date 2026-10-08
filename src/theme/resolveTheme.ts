import { motion } from './tokens/motion';
import { radius } from './tokens/radius';
import { layout, space } from './tokens/spacing';
import { createTypeScale } from './tokens/typography';
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

/** Builds the full theme object components read. */
export function buildTheme(definition: ThemeDefinition, scheme: SchemeName): Theme {
  const colorScheme = definition.schemes[scheme];
  return {
    id: definition.id,
    name: definition.name,
    scheme,
    colors: colorScheme.colors,
    statusBarStyle: colorScheme.statusBarStyle,
    fonts: definition.fonts.families,
    type: createTypeScale(definition.fonts.families),
    space,
    radius,
    layout,
    motion,
  };
}
