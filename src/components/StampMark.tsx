import { View } from 'react-native';

import { createStyles } from '@/theme';

import { Txt } from './Txt';

export type StampMarkProps = {
  /** "VINCO" or "DAY I". */
  text: string;
  /** Small line under the text, such as the date on the DAY I stamp. */
  caption?: string;
  size?: 'large' | 'medium';
};

/**
 * The porphyry wax-stamp mark. Static: the overlay that shows it does the slam,
 * so the same mark can appear without motion (reduced motion, day card).
 */
export function StampMark({ text, caption, size = 'large' }: StampMarkProps) {
  const styles = useStyles();
  const isLarge = size === 'large';

  return (
    <View
      style={[styles.frame, isLarge ? styles.frameLarge : styles.frameMedium]}
      accessible
      accessibilityLabel={caption ? `${text}, ${caption}` : text}
    >
      <Txt variant="hero" color="danger" style={isLarge ? styles.textLarge : styles.textMedium}>
        {text}
      </Txt>
      {caption ? (
        <Txt variant="labelSmall" color="danger" style={styles.caption}>
          {caption}
        </Txt>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.colors.danger,
  },
  frameLarge: {
    borderWidth: theme.layout.stampBorderWidthLarge,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.xxl,
    paddingVertical: theme.space.sm,
  },
  frameMedium: {
    borderWidth: theme.layout.stampBorderWidth,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.space.xl,
    paddingVertical: theme.space.md,
  },
  textLarge: { letterSpacing: 10 },
  // The DAY I stamp in the prototype is a step down from the hero size.
  textMedium: { fontSize: 44, lineHeight: 48, letterSpacing: 6 },
  caption: { letterSpacing: 1, marginTop: theme.space.xs },
}));
