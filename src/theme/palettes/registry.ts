import type { ColorScheme, SchemeName } from '../types';

import { aes } from './aes';
import { basalt } from './basalt';
import { calx } from './calx';
import { marble } from './marble';
import { nox } from './nox';
import { papyrus } from './papyrus';
import { purpura } from './purpura';

/**
 * A palette: one full set of colour roles for dark or light. The user picks one of each, and the
 * colour mode (dark, light, or follow the phone) chooses between the two picks. Fonts and sounds
 * come from the theme (themes/), so every palette keeps Vinco's type and voice.
 *
 * To add a palette:
 * 1. Create palettes/<id>.ts exporting a ColorScheme with every role filled.
 * 2. Add it to PALETTES with its scheme. The contrast tests (themes.test.ts) cover it at once.
 * 3. Add its plain label to settingsCopy.palettes.
 */
export type PaletteId = 'basalt' | 'nox' | 'purpura' | 'aes' | 'marble' | 'papyrus' | 'calx';

export type Palette = ColorScheme & {
  id: PaletteId;
  /** Its Latin name, shown with a plain label from the copy. */
  name: string;
  scheme: SchemeName;
};

/** Dark palettes first, then light, each with its default first. */
export const PALETTES: readonly Palette[] = [
  { id: 'basalt', name: 'Basalt', scheme: 'dark', ...basalt },
  { id: 'nox', name: 'Nox', scheme: 'dark', ...nox },
  { id: 'purpura', name: 'Purpura', scheme: 'dark', ...purpura },
  { id: 'aes', name: 'Aes', scheme: 'dark', ...aes },
  { id: 'marble', name: 'Marble', scheme: 'light', ...marble },
  { id: 'papyrus', name: 'Papyrus', scheme: 'light', ...papyrus },
  { id: 'calx', name: 'Calx', scheme: 'light', ...calx },
];

export const DEFAULT_PALETTE_IDS: Record<SchemeName, PaletteId> = { dark: 'basalt', light: 'marble' };

/** The palettes for one scheme, default first. */
export function palettesFor(scheme: SchemeName): Palette[] {
  return PALETTES.filter((palette) => palette.scheme === scheme);
}

/** Whether an id names a palette of this scheme (a saved choice is checked on restore). */
export function isPaletteFor(id: unknown, scheme: SchemeName): id is PaletteId {
  return PALETTES.some((palette) => palette.id === id && palette.scheme === scheme);
}

/** The palette with this id for this scheme, or the scheme's default when the id is unknown or the wrong scheme. */
export function getPalette(id: string, scheme: SchemeName): Palette {
  const found = PALETTES.find((palette) => palette.id === id && palette.scheme === scheme);
  if (found) return found;
  const fallback = PALETTES.find((palette) => palette.id === DEFAULT_PALETTE_IDS[scheme]);
  if (!fallback) throw new Error(`[theme] Missing default ${scheme} palette.`);
  return fallback;
}
