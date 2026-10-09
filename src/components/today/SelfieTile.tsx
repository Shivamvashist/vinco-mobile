import { Pressable, View } from 'react-native';

import { proofCopy } from '@/copy';
import { createStyles, useTheme } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type SelfieTileProps = {
  isTaken: boolean;
  onPress: () => void;
};

/** Today's selfie: opens the camera. Until taken, an accent border marks it as the next step. */
export function SelfieTile({ isTaken, onPress }: SelfieTileProps) {
  const theme = useTheme();
  const styles = useStyles();
  const status = isTaken ? proofCopy.todayTile.taken : proofCopy.todayTile.notTaken;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${proofCopy.todayTile.title}, ${status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, !isTaken && styles.call, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon name={isTaken ? 'check' : 'camera'} color="accent" />
      </View>
      <View style={styles.text}>
        <Txt variant="label">{proofCopy.todayTile.title}</Txt>
        <Txt variant="caption" color={isTaken ? 'accent' : 'textMuted'}>
          {status}
        </Txt>
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
    borderWidth: theme.layout.borderWidth,
    borderColor: 'transparent',
    backgroundColor: theme.colors.surface,
  },
  /** Not taken yet: an accent border makes it the next thing to do. */
  call: { borderColor: theme.colors.accentBorder },
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
