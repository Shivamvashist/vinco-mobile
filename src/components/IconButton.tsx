import { Pressable } from 'react-native';

import { type ColorRole, createStyles, type FeedbackCue, useFeedback } from '@/theme';

import { Icon, type IconName } from './Icon';

export type IconButtonProps = {
  icon: IconName;
  /** Required: an icon alone means nothing to a screen reader. */
  accessibilityLabel: string;
  onPress: () => void;
  color?: ColorRole;
  cue?: FeedbackCue | null;
};

/** A 44 by 44 tappable icon: back, close, flip camera. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  color = 'text',
  cue = null,
}: IconButtonProps) {
  const styles = useStyles();
  const play = useFeedback();

  const handlePress = () => {
    if (cue) play(cue);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      <Icon name={icon} color={color} />
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  base: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
}));
