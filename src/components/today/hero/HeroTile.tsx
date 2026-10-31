import type { ReactNode } from 'react';
import { View } from 'react-native';

import { type ColorRole, createStyles, useTheme } from '@/theme';

import { Icon, type IconName } from '../../Icon';
import { PressableScale } from '../../PressableScale';
import { Txt } from '../../Txt';
import { Glow } from './Glow';

export type HeroTileProps = {
  icon: IconName;
  title: string;
  /** The tile's light: one palette role per tile, so the two read apart at a glance. */
  glow: ColorRole;
  glowOrigin: 'bottomLeft' | 'bottomRight';
  /** Brighter when the tile has news (paid today, a reward due). */
  isLit: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
  children: ReactNode;
};

/** One fact under the hero: a titled tile with a corner glow and a spring press. */
export function HeroTile({
  icon,
  title,
  glow,
  glowOrigin,
  isLit,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  children,
}: HeroTileProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <PressableScale
      scaleTo="card"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={styles.tile}
      containerStyle={styles.container}
    >
      <Glow color={glow} intensity={isLit ? 0.9 : 0.5} origin={glowOrigin} />
      <View style={styles.title} importantForAccessibility="no-hide-descendants">
        <Icon name={icon} size={theme.layout.iconSizeSmall} color={glow} strokeWidth={2} />
        <Txt variant="label">{title}</Txt>
      </View>
      <View importantForAccessibility="no-hide-descendants">{children}</View>
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  container: { flex: 1 },
  tile: {
    flexGrow: 1,
    minHeight: theme.layout.tileHeight,
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  title: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs },
}));
