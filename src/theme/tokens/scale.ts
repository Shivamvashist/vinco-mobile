import { PixelRatio } from 'react-native';

import type { TypeScale } from '../types';
import type { layout, space } from './spacing';

/** The phone width (dp) the sizes were designed at. Wider phones keep the design sizes. */
export const DESIGN_WIDTH = 412;

/** Narrow phones shrink spacing and fixed sizes down to this share, and no further. */
const MIN_SIZE_SCALE = 0.84;

/** Type shrinks less than spacing, so text stays easy to read on small phones. */
const TYPE_SHRINK_SHARE = 0.55;

/** Sizes that must never shrink: touch targets and hairlines. */
const FIXED_LAYOUT_KEYS = new Set<keyof typeof layout>([
  'minTouchTarget',
  'borderWidth',
  'borderWidthStrong',
  'hairline',
  'stampBorderWidth',
  'stampBorderWidthLarge',
]);

export type SpaceTokens = { readonly [Key in keyof typeof space]: number };
export type LayoutTokens = { readonly [Key in keyof typeof layout]: number };

/**
 * How much to shrink the design for this window width: 1 on phones as wide as the design or
 * wider, down to MIN_SIZE_SCALE on the narrowest. Sizes then follow the screen, not fixed pixels.
 */
export function getSizeScale(windowWidth: number): number {
  if (!Number.isFinite(windowWidth) || windowWidth <= 0) return 1;
  return Math.min(1, Math.max(MIN_SIZE_SCALE, windowWidth / DESIGN_WIDTH));
}

/** The share type sizes use for a size scale. */
export function getTypeScale(sizeScale: number): number {
  return 1 - (1 - sizeScale) * TYPE_SHRINK_SHARE;
}

const round = (value: number) => PixelRatio.roundToNearestPixel(value);

export function scaleSpace(tokens: typeof space, scale: number): SpaceTokens {
  return mapValues(tokens, (value) => round(value * scale));
}

export function scaleLayout(tokens: typeof layout, scale: number): LayoutTokens {
  return mapValues(tokens, (value, key) => (FIXED_LAYOUT_KEYS.has(key) ? value : round(value * scale)));
}

export function scaleTypeScale(typeScale: TypeScale, scale: number): TypeScale {
  if (scale === 1) return typeScale;
  return mapValues(typeScale, (style) => ({
    ...style,
    fontSize: round((style.fontSize ?? 0) * scale),
    lineHeight: round((style.lineHeight ?? 0) * scale),
  }));
}

function mapValues<Source extends object, Value>(
  source: Source,
  map: (value: Source[keyof Source], key: keyof Source) => Value,
): { [Key in keyof Source]: Value } {
  const result = {} as { [Key in keyof Source]: Value };
  for (const key of Object.keys(source) as (keyof Source)[]) result[key] = map(source[key], key);
  return result;
}
