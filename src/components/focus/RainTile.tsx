import { View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { focusCopy } from '@/copy';
import { cardSurface, createStyles } from '@/theme';

import { RainField } from './RainField';
import { RainSoundToggle } from './RainSoundToggle';

export type RainTileProps = {
  isSoundOn: boolean;
  onToggleSound: () => void;
  /** The screensaver is on, or the full-screen rain covers the tile: the drops rest. */
  isPaused: boolean;
  /** Opens the full-screen rain (RainFullScreen). */
  onExpand: () => void;
};

/**
 * The rain on the running focus: falling pixels that ripple where they are touched, a speaker in
 * the top corner that turns the soft rain sound on and off, and corners at the bottom that fill
 * the screen with the rain.
 */
export function RainTile({ isSoundOn, onToggleSound, isPaused, onExpand }: RainTileProps) {
  const styles = useStyles();
  return (
    <View style={styles.tile}>
      <RainField isPaused={isPaused} />
      <RainSoundToggle isSoundOn={isSoundOn} onToggle={onToggleSound} style={styles.topRight} />
      <View style={styles.bottomLeft}>
        <IconButton
          icon="expand"
          accessibilityLabel={focusCopy.active.rainFull}
          onPress={onExpand}
          color="textMuted"
          cue="tap"
        />
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  tile: {
    flex: 2,
    minHeight: theme.layout.minTouchTarget * 2,
    overflow: 'hidden',
    ...cardSurface(theme),
  },
  topRight: { position: 'absolute', top: 0, right: 0 },
  bottomLeft: { position: 'absolute', bottom: theme.space.xxs, left: theme.space.xxs },
}));
