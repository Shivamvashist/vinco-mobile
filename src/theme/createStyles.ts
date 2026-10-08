import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from './ThemeProvider';
import type { Theme } from './types';

/**
 * Creates a hook that builds themed styles, rebuilt only when the theme changes.
 * This is the only way components should style themselves.
 *
 * @example
 * const useStyles = createStyles((theme) => ({
 *   card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md },
 * }));
 *
 * function Card() {
 *   const styles = useStyles();
 *   return <View style={styles.card} />;
 * }
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
