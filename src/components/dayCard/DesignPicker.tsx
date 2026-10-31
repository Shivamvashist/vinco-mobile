import { Pressable, ScrollView, View } from 'react-native';

import { dayCardCopy } from '@/copy';
import type { DayCardDesignId } from '@/features/dayCard';
import { createStyles, type DayCardStyle, useFeedback } from '@/theme';

import { Txt } from '../Txt';
import { DesignThumb } from './designs/DesignThumb';

const THUMB_WIDTH = 34;

export type DesignPickerProps = {
  designs: readonly DayCardDesignId[];
  selected: DayCardDesignId;
  /** Thumbnails preview each design in the colour style picked now. */
  cardStyle: DayCardStyle;
  onSelect: (designId: DayCardDesignId) => void;
};

/** A row of day card designs to pick from, each a small sketch with its name. Scrolls sideways. */
export function DesignPicker({ designs, selected, cardStyle, onSelect }: DesignPickerProps) {
  const styles = useStyles();
  const play = useFeedback();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
      accessibilityRole="radiogroup"
    >
      {designs.map((designId) => {
        const isSelected = designId === selected;
        const name = dayCardCopy.designs[designId];
        return (
          <Pressable
            key={designId}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={dayCardCopy.designLabel(name)}
            onPress={() => {
              if (isSelected) return;
              play('select');
              onSelect(designId);
            }}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.thumb}>
              <DesignThumb designId={designId} cardStyle={cardStyle} width={THUMB_WIDTH} />
            </View>
            <Txt variant="micro" color={isSelected ? 'accent' : 'textMuted'} numberOfLines={1}>
              {name}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = createStyles((theme) => ({
  scroller: { alignSelf: 'stretch', flexGrow: 0 },
  // Centred while the chips fit; scrolls sideways once they don't.
  row: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: theme.space.sm,
    paddingHorizontal: theme.layout.flowGutter,
  },
  chip: {
    minWidth: theme.layout.minTouchTarget + theme.space.lg,
    alignItems: 'center',
    gap: theme.space.xs,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidthStrong,
    borderColor: theme.colors.border,
  },
  chipSelected: { borderColor: theme.colors.accent },
  pressed: { opacity: 0.7 },
  thumb: { borderRadius: theme.radius.xs, overflow: 'hidden' },
}));
