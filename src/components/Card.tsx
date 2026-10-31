import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { createStyles } from '@/theme';

export type CardProps = Omit<ViewProps, 'style'> & {
  children: ReactNode;
  /** `surface` for content cards, `sunk` for inset rows, `raised` for previews. */
  variant?: 'surface' | 'sunk' | 'raised';
  /** Adds the theme border. Sunk rows in the prototype are bordered; surface cards are not. */
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A rounded container on a theme surface. Not pressable: wrap content in a Pressable for that. */
export function Card({ children, variant = 'surface', bordered = false, style, ...rest }: CardProps) {
  const styles = useStyles();
  return (
    <View style={[styles.base, styles[variant], bordered && styles.bordered, style]} {...rest}>
      {children}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  base: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    paddingVertical: theme.layout.cardPadding,
    paddingHorizontal: theme.space.lg,
  },
  // On light palettes, cards lift off the ground with a soft shadow (none on dark: theme effects).
  surface: { backgroundColor: theme.colors.surface, boxShadow: theme.effects.cardShadow },
  sunk: { backgroundColor: theme.colors.surfaceSunk },
  raised: { backgroundColor: theme.colors.surfaceRaised, boxShadow: theme.effects.cardShadow },
  bordered: {
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.effects.cardBorder,
  },
}));
