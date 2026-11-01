import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { focusCopy } from '@/copy';
import { cardSurface, createStyles, useFeedback } from '@/theme';

import { RainField } from './RainField';

export type RainTileProps = {
  isSoundOn: boolean;
  onToggleSound: () => void;
  /** The screensaver is on: the drops rest. */
  isPaused: boolean;
};

/**
 * The rain on the running focus: falling pixels that ripple where they are touched, and a speaker
 * in the corner that turns the soft rain sound on and off (a switch for screen readers).
 */
export function RainTile({ isSoundOn, onToggleSound, isPaused }: RainTileProps) {
  const styles = useStyles();
  const play = useFeedback();
  return (
    <View style={styles.tile}>
      <RainField isPaused={isPaused} />
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={focusCopy.active.rainSoundOn}
        accessibilityHint={focusCopy.active.rainSoundHint}
        accessibilityState={{ checked: isSoundOn }}
        onPress={() => {
          play('toggle');
          onToggleSound();
        }}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <View style={[styles.toggleFace, isSoundOn && styles.toggleOn]}>
          <Icon name={isSoundOn ? 'sound' : 'soundOff'} color={isSoundOn ? 'accent' : 'textMuted'} />
        </View>
      </Pressable>
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
  toggle: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: theme.layout.minTouchTarget + theme.space.sm,
    height: theme.layout.minTouchTarget + theme.space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleFace: {
    width: theme.layout.minTouchTarget - theme.space.xs,
    height: theme.layout.minTouchTarget - theme.space.xs,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSunk,
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
  },
  toggleOn: { backgroundColor: theme.colors.accentTint, borderColor: theme.colors.accentBorder },
  pressed: { opacity: 0.6 },
}));
