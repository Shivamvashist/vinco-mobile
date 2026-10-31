import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { ClipPath, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { notchedTilePath } from '@/lib/notchedTile';
import { type ColorRole, useTheme } from '@/theme';

export type NotchedSurfaceProps = {
  width: number;
  height: number;
  notchRadius: number;
  /** The corner light's colour role, rising from the bottom left (away from the bite). */
  glow: ColorRole;
  /** 0 (off) to 1 (full); softened on light palettes by the theme's glow strength. */
  glowIntensity: number;
};

/** The fillets that join the bite to the tile's edges. */
const FILLET = 10;

/**
 * A tile's surface with a round bite out of its bottom-right corner, where a button sits. Drawn
 * as one SVG path in the palette's surface and hairline colours, with the tile's glow clipped to
 * the same outline, so the bite stays clean on every palette. Sits behind the tile's content.
 */
export function NotchedSurface({ width, height, notchRadius, glow, glowIntensity }: NotchedSurfaceProps) {
  const theme = useTheme();
  const id = useId().replace(/:/g, '');
  const stroke = theme.layout.hairline;
  // Inset by half the stroke, so the hairline is drawn whole inside the tile's box.
  const path = notchedTilePath({
    width: width - stroke,
    height: height - stroke,
    cornerRadius: theme.radius.lg,
    notchRadius,
    filletRadius: FILLET,
  });
  if (!path) return null;
  const opacity = glowIntensity * theme.effects.glowStrength;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <ClipPath id={`${id}clip`}>
          <Path d={path} x={stroke / 2} y={stroke / 2} />
        </ClipPath>
        <RadialGradient id={`${id}glow`} cx="0%" cy="110%" rx="95%" ry="95%">
          <Stop offset="0" stopColor={theme.colors[glow]} stopOpacity={0.55 * opacity} />
          <Stop offset="0.45" stopColor={theme.colors[glow]} stopOpacity={0.2 * opacity} />
          <Stop offset="1" stopColor={theme.colors[glow]} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path d={path} x={stroke / 2} y={stroke / 2} fill={theme.colors.surface} />
      <Rect width={width} height={height} fill={`url(#${id}glow)`} clipPath={`url(#${id}clip)`} />
      <Path
        d={path}
        x={stroke / 2}
        y={stroke / 2}
        fill="none"
        stroke={theme.effects.cardBorder}
        strokeWidth={stroke}
      />
    </Svg>
  );
}
