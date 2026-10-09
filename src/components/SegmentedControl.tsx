import { Pressable, View } from 'react-native';

import { createStyles, useFeedback } from '@/theme';

import { Txt } from './Txt';

export type SegmentedControlProps<Value extends string> = {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
};

/**
 * Two or three views of one screen, side by side (Vidi's Calendar and Commentarii). The selected
 * segment is a marble pill; switching plays the prototype's segment tick.
 */
export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) {
  const styles = useStyles();
  const play = useFeedback();
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (isSelected) return;
              play('toggle');
              onChange(option.value);
            }}
            style={[styles.segment, isSelected && styles.selected]}
          >
            <Txt variant="label" color={isSelected ? 'onInverse' : 'textMuted'} numberOfLines={1}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  track: {
    flexDirection: 'row',
    gap: theme.space.xs,
    padding: theme.space.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  segment: {
    flex: 1,
    minHeight: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  selected: { backgroundColor: theme.colors.inverse },
}));
