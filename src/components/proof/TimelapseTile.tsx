import { Pressable, View } from 'react-native';

import { proofCopy } from '@/copy';
import { createStyles, useTheme } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type TimelapseTileProps = {
  frames: number;
  onPress: () => void;
};

/** Plays this campaign's selfies as a timelapse. Shown once there are at least two. */
export function TimelapseTile({ frames, onPress }: TimelapseTileProps) {
  const theme = useTheme();
  const styles = useStyles();
  const copy = proofCopy.reel.arcTile;
  const detail = copy.detail(frames);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}, ${detail}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon name="play" color="accent" />
      </View>
      <View style={styles.text}>
        <Txt variant="label">{copy.title}</Txt>
        <Txt variant="caption">{detail}</Txt>
      </View>
      <Icon name="forward" size={theme.layout.iconSizeSmall} color="textMuted" />
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.layout.cardPadding,
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: theme.layout.iconTileSize,
    height: theme.layout.iconTileSize,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  text: { flex: 1, minWidth: 0 },
}));
