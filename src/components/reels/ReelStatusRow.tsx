import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { reelsCopy } from '@/copy';
import { createStyles, useFeedback, useTheme } from '@/theme';

export type ReelStatusRowProps = {
  /** False in Expo Go and older builds. */
  canCount: boolean;
  /** The guard service: on, off, or null while it is being read. */
  isServiceOn: boolean | null;
};

const copy = reelsCopy.status;

/**
 * One compact line when reels can't be counted, and nothing when they can. In Expo Go it says the
 * counter arrives with the build; with the guard service off it opens /permissions, where what the
 * counter reads is said before the phone's settings open (Play's prominent disclosure).
 */
export function ReelStatusRow({ canCount, isServiceOn }: ReelStatusRowProps) {
  const styles = useStyles();
  const theme = useTheme();
  const play = useFeedback();

  if (!canCount) {
    return (
      <View style={styles.row}>
        <Icon name="lock" color="textMuted" size={theme.layout.iconSizeSmall} />
        <Txt variant="caption" style={styles.text}>
          {copy.notYet}
        </Txt>
      </View>
    );
  }
  if (isServiceOn !== false) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.off}. ${copy.offAction}`}
      accessibilityHint={copy.offHint}
      onPress={() => {
        play('tap');
        router.push('/permissions');
      }}
      style={[styles.row, styles.off]}
    >
      <Icon name="alert" color="danger" size={theme.layout.iconSizeSmall} />
      <Txt variant="label" style={styles.text}>
        {copy.off}
      </Txt>
      <Txt variant="label" color="accent">
        {copy.offAction}
      </Txt>
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: theme.layout.minTouchTarget,
  },
  off: {
    paddingHorizontal: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunk,
  },
  text: { flex: 1 },
}));
