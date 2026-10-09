import { Pressable } from 'react-native';

import { createStyles, type FeedbackCue, useFeedback } from '@/theme';

import { Txt } from './Txt';

export type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  cue?: FeedbackCue | null;
};

/** Hit area grows to 44 high around the 36-high pill. */
const HIT_SLOP = { top: 4, bottom: 4, left: 0, right: 0 };

/**
 * One option in a small set of chips, such as the tone preview scenes.
 * Wrap the set in a View with accessibilityRole="radiogroup".
 */
export function ChoiceChip({ label, selected, onPress, cue = 'toggle' }: ChoiceChipProps) {
  const styles = useStyles();
  const play = useFeedback();

  const handlePress = () => {
    if (selected) return;
    if (cue) play(cue);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      hitSlop={HIT_SLOP}
      onPress={handlePress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <Txt variant="labelSmall" color={selected ? 'text' : 'textMuted'} numberOfLines={1}>
        {label}
      </Txt>
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  chip: {
    minHeight: theme.layout.choiceChipHeight,
    paddingHorizontal: theme.space.lg,
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
  },
  selected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentTint,
  },
  pressed: { opacity: 0.7 },
}));
