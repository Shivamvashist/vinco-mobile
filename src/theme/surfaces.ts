import type { ViewStyle } from 'react-native';

import type { ColorRole, Theme } from './types';

/**
 * One card language for every palette and scheme: a theme surface, the card hairline and soft
 * shadow from `theme.effects`, a continuous curve and the tile radius. `Card` is built on it;
 * a component that cannot be a `Card` (a pressable tile, a list container) spreads it instead.
 *
 * @example
 * tile: { ...cardSurface(theme), padding: theme.layout.cardPadding }
 */
export function cardSurface(theme: Theme, level: 'surface' | 'raised' = 'surface'): ViewStyle {
  return {
    backgroundColor: level === 'raised' ? theme.colors.surfaceRaised : theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
    boxShadow: theme.effects.cardShadow,
  };
}

/**
 * The small square behind a card's icon (an order, a labour, the dawn sun), on a soft fill.
 * `shape: 'round'` for a single centred mark.
 */
export function iconTile(
  theme: Theme,
  fill: ColorRole = 'accentSoft',
  shape: 'square' | 'round' = 'square',
): ViewStyle {
  return {
    width: theme.layout.iconTileSize,
    height: theme.layout.iconTileSize,
    borderRadius: shape === 'round' ? theme.radius.pill : theme.radius.sm,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors[fill],
  };
}
