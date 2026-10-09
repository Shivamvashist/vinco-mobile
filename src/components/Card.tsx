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
    paddingVertical: theme.layout.cardPadding,
    paddingHorizontal: theme.space.lg,
  },
  surface: { backgroundColor: theme.colors.surface },
  sunk: { backgroundColor: theme.colors.surfaceSunk },
  raised: { backgroundColor: theme.colors.surfaceRaised },
  bordered: {
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
  },
}));
