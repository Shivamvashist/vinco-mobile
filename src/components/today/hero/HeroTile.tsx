import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { notchRadiusFor } from '@/lib/notchedTile';
import { cardSurface, type ColorRole, createStyles, useTheme } from '@/theme';

import { Icon, type IconName } from '../../Icon';
import { PressableScale } from '../../PressableScale';
import { Txt } from '../../Txt';
import { Glow } from '../../Glow';
import { NotchedSurface } from './NotchedSurface';

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
  /**
   * A round button seated in a curved bite out of the tile's bottom-right corner (Focus's play).
   * It should be `theme.layout.minTouchTarget` across; the tile's text keeps clear of the bite.
   */
  cornerAction?: ReactNode;
  children: ReactNode;
};

/** The even gap between a corner action and the bite around it. */
const NOTCH_GAP = 6;

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
  cornerAction,
  children,
}: HeroTileProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const hasNotch = cornerAction != null;
  const notchRadius = notchRadiusFor(theme.layout.minTouchTarget / 2, NOTCH_GAP);
  return (
    <PressableScale
      scaleTo="card"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[styles.tile, hasNotch && styles.notchedTile]}
      containerStyle={styles.container}
      onLayout={
        hasNotch
          ? (event) =>
              setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })
          : undefined
      }
    >
      {hasNotch ? (
        <NotchedSurface
          width={size.width}
          height={size.height}
          notchRadius={notchRadius}
          glow={glow}
          glowIntensity={isLit ? 0.9 : 0.5}
        />
      ) : (
        <Glow color={glow} intensity={isLit ? 0.9 : 0.5} origin={glowOrigin} />
      )}
      <View style={styles.title} importantForAccessibility="no-hide-descendants">
        <Icon name={icon} size={theme.layout.iconSizeSmall} color={glow} strokeWidth={2} />
        <Txt variant="label">{title}</Txt>
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        style={hasNotch ? { paddingRight: notchRadius - theme.layout.cardPadding } : undefined}
      >
        {children}
      </View>
      {hasNotch ? <View style={styles.corner}>{cornerAction}</View> : null}
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  container: { flex: 1 },
  tile: {
    flexGrow: 1,
    minHeight: theme.layout.tileHeight,
    padding: theme.layout.cardPadding,
    ...cardSurface(theme),
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  // The notched surface draws the background, border and glow itself (NotchedSurface).
  notchedTile: { backgroundColor: 'transparent', borderWidth: 0, boxShadow: undefined, overflow: 'visible' },
  corner: { position: 'absolute', right: 0, bottom: 0 },
  title: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs },
}));
