import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { cardSurface, type ColorRole, createStyles } from '@/theme';

import { Glow, type GlowProps } from './Glow';

export type CardGlow = {
  /** The light's colour role: accent for wins and dawn, danger for a warning, info for data. */
  color: ColorRole;
  /** Where the light rises from. Default: the bottom. */
  origin?: GlowProps['origin'];
  /** 0 to 1, softened on light palettes by the theme. Default 0.6. */
  intensity?: number;
};

export type CardProps = Omit<ViewProps, 'style'> & {
  children: ReactNode;
  /**
   * `surface` for content cards, `raised` for previews and menus (both: the card hairline, soft
   * shadow on light palettes, continuous curve, radius lg), `sunk` for inset rows (radius md).
   */
  variant?: 'surface' | 'sunk' | 'raised';
  /** Adds the card hairline to a sunk row. Surface and raised cards always have it. */
  bordered?: boolean;
  /** A soft palette light rising behind the content (the hero's language). */
  glow?: CardGlow;
  style?: StyleProp<ViewStyle>;
};

/**
 * A rounded container on a theme surface: the single card language for every palette and scheme
 * (DESIGN-SYSTEM "Surfaces"). Not pressable: wrap content in a Pressable for that.
 */
export function Card({ children, variant = 'surface', bordered = false, glow, style, ...rest }: CardProps) {
  const styles = useStyles();
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        bordered && variant === 'sunk' && styles.sunkBordered,
        glow && styles.glowing,
        style,
      ]}
      {...rest}
    >
      {glow ? <Glow color={glow.color} intensity={glow.intensity ?? 0.6} origin={glow.origin} /> : null}
      {children}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  base: {
    paddingVertical: theme.layout.cardPadding,
    paddingHorizontal: theme.space.lg,
  },
  surface: cardSurface(theme),
  raised: cardSurface(theme, 'raised'),
  sunk: {
    backgroundColor: theme.colors.surfaceSunk,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
  },
  sunkBordered: {
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
  },
  glowing: { overflow: 'hidden' },
}));
