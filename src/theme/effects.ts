import { parseColor } from './contrast';
import type { ColorPalette, SchemeName } from './types';

/**
 * Depth for one scheme: how strongly cards glow, the hairline round them and the shadow under
 * them. Built from the palette, so every palette (and any new one) gets them for free.
 *
 * Dark: glows at full strength, the plain border, no shadow (the ground is darker than the card).
 * Light: glows softer (at dark strength a coloured glow reads as a stain on pale stone), a
 * hairline a step stronger (pale surfaces barely part from a pale ground), and a soft shadow
 * tinted with the palette's own ink.
 */
export type ThemeEffects = {
  /** Multiplies every glow's intensity: 1 on dark, less on light. */
  glowStrength: number;
  /** The hairline round cards, tiles and the hero. */
  cardBorder: string;
  /** A soft shadow for cards, tiles and the hero, as a CSS box shadow; none (undefined) on dark. */
  cardShadow: string | undefined;
};

const LIGHT = {
  glowStrength: 0.5,
  /** How far the hairline moves from border toward borderStrong. */
  borderStep: 0.45,
  /** Two layers: a tight contact shadow and a wide, faint lift. */
  shadow: [
    { y: 1, blur: 2, alpha: 0.06 },
    { y: 6, blur: 16, alpha: 0.07 },
  ],
} as const;

export function buildEffects(colors: ColorPalette, scheme: SchemeName): ThemeEffects {
  if (scheme === 'dark') return { glowStrength: 1, cardBorder: colors.border, cardShadow: undefined };
  const ink = parseColor(colors.text);
  return {
    glowStrength: LIGHT.glowStrength,
    cardBorder: mixColors(colors.border, colors.borderStrong, LIGHT.borderStep),
    cardShadow: LIGHT.shadow
      .map(({ y, blur, alpha }) => `0px ${y}px ${blur}px 0px rgba(${ink.r},${ink.g},${ink.b},${alpha})`)
      .join(', '),
  };
}

/** A solid colour part way from one to another (0 gives the first, 1 the second), as hex. */
export function mixColors(from: string, to: string, amount: number): string {
  const a = parseColor(from);
  const b = parseColor(to);
  const t = Math.min(1, Math.max(0, amount));
  const channel = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(a.r, b.r)}${channel(a.g, b.g)}${channel(a.b, b.b)}`.toUpperCase();
}
