import { Pressable, type StyleProp, View, type ViewStyle } from 'react-native';

import { Icon } from '@/components/Icon';
import { focusCopy } from '@/copy';
import { createStyles, useFeedback } from '@/theme';

export type RainSoundToggleProps = {
  isSoundOn: boolean;
  onToggle: () => void;
  /** Where it sits (the parent places it). */
  style?: StyleProp<ViewStyle>;
};

/** The speaker that turns the soft rain sound on and off: a switch for screen readers. */
export function RainSoundToggle({ isSoundOn, onToggle, style }: RainSoundToggleProps) {
  const styles = useStyles();
  const play = useFeedback();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={focusCopy.active.rainSoundOn}
      accessibilityHint={focusCopy.active.rainSoundHint}
      accessibilityState={{ checked: isSoundOn }}
      onPress={() => {
        play('toggle');
        onToggle();
      }}
      style={({ pressed }) => [styles.toggle, style, pressed && styles.pressed]}
    >
      <View style={[styles.face, isSoundOn && styles.on]}>
        <Icon name={isSoundOn ? 'sound' : 'soundOff'} color={isSoundOn ? 'accent' : 'textMuted'} />
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  toggle: {
    width: theme.layout.minTouchTarget + theme.space.sm,
    height: theme.layout.minTouchTarget + theme.space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    width: theme.layout.minTouchTarget - theme.space.xs,
    height: theme.layout.minTouchTarget - theme.space.xs,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSunk,
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
  },
  on: { backgroundColor: theme.colors.accentTint, borderColor: theme.colors.accentBorder },
  pressed: { opacity: 0.6 },
}));
