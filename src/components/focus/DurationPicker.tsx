import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { RollingNumber } from '@/components/RollingNumber';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { FOCUS_RULES, formatHoursMinutes } from '@/features/focus';
import { createStyles, useFeedback, useTheme } from '@/theme';

import { CustomDurationSheet } from './CustomDurationSheet';
import { DurationRuler } from './DurationRuler';

export type DurationPickerProps = {
  /** Minutes, 5 to 180. */
  value: number;
  onChange: (minutes: number) => void;
};

/** The focus length: a big h:mm readout, the quick lengths and Custom, then the ruler. */
export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const styles = useStyles();
  const play = useFeedback();
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  // Off the ruler's 5-minute ticks: only a typed length can be there.
  const isCustom = value % FOCUS_RULES.stepMinutes !== 0;

  const pick = (minutes: number) => {
    if (minutes === value) return;
    play('select');
    onChange(minutes);
  };

  return (
    <View style={styles.wrap}>
      <View
        style={styles.reading}
        accessible
        accessibilityRole="text"
        accessibilityLabel={focusCopy.spokenDuration(value)}
        accessibilityLiveRegion="polite"
      >
        <RollingNumber value={formatHoursMinutes(value)} variant="numeral" fit />
      </View>

      <View
        style={styles.presets}
        accessibilityRole="radiogroup"
        accessibilityLabel={focusCopy.setup.presetsLabel}
      >
        {FOCUS_RULES.presets.map((preset) => (
          <Chip
            key={preset}
            label={focusCopy.shortDuration(preset)}
            accessibilityLabel={focusCopy.spokenDuration(preset)}
            isSelected={preset === value}
            onPress={() => pick(preset)}
          />
        ))}
        <Chip
          label={isCustom ? focusCopy.shortDuration(value) : focusCopy.setup.custom}
          accessibilityLabel={focusCopy.setup.customLabel}
          isSelected={isCustom}
          onPress={() => {
            play('tap');
            setIsCustomOpen(true);
          }}
        />
      </View>

      <DurationRuler value={value} onChange={onChange} />

      <CustomDurationSheet
        visible={isCustomOpen}
        initialMinutes={value}
        onClose={() => setIsCustomOpen(false)}
        onSet={(minutes) => {
          setIsCustomOpen(false);
          onChange(minutes);
        }}
      />
    </View>
  );
}

type ChipProps = { label: string; accessibilityLabel: string; isSelected: boolean; onPress: () => void };

/** Chips grow with the phone's font size up to this, then the row wraps instead of clipping. */
const MAX_CHIP_FONT_SCALE = 1.6;

function Chip({ label, accessibilityLabel, isSelected, onPress }: ChipProps) {
  const styles = useStyles();
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const minWidth =
    (theme.layout.minTouchTarget + theme.space.xs) * Math.min(MAX_CHIP_FONT_SCALE, Math.max(1, fontScale));
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={theme.space.xs}
      onPress={onPress}
      containerStyle={[styles.chipCell, { minWidth }]}
      style={[styles.chip, isSelected && styles.chipSelected]}
    >
      <Txt
        variant="labelSmall"
        color={isSelected ? 'text' : 'textMuted'}
        style={styles.tabular}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {label}
      </Txt>
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.lg },
  reading: { alignItems: 'center', alignSelf: 'stretch' },
  tabular: { fontVariant: ['tabular-nums'] },
  // One row of equal chips on any phone width; with large text they wrap rather than clip.
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  chipCell: { flexGrow: 1, flexBasis: 0 },
  chip: {
    minHeight: theme.layout.choiceChipHeight,
    paddingHorizontal: theme.space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
  },
  chipSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentTint },
}));
