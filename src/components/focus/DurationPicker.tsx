import { useState } from 'react';
import { View } from 'react-native';

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

function Chip({ label, accessibilityLabel, isSelected, onPress }: ChipProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={theme.space.xs}
      onPress={onPress}
      style={[styles.chip, isSelected && styles.chipSelected]}
    >
      <Txt variant="labelSmall" color={isSelected ? 'text' : 'textMuted'} style={styles.tabular}>
        {label}
      </Txt>
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.lg },
  reading: { alignItems: 'center', alignSelf: 'stretch' },
  tabular: { fontVariant: ['tabular-nums'] },
  presets: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: theme.space.sm },
  chip: {
    minWidth: theme.layout.minTouchTarget,
    minHeight: theme.layout.choiceChipHeight,
    paddingHorizontal: theme.space.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
  },
  chipSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentTint },
}));
