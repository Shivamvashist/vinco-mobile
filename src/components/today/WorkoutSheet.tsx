import { useState } from 'react';
import { View } from 'react-native';

import { todayCopy } from '@/copy';
import type { OrderTarget } from '@/features/orders';
import { WORKOUT_NOTE_MAX_LENGTH } from '@/hooks/useTodayOrders';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { OptionCard } from '../OptionCard';
import { Stepper } from '../Stepper';
import { TextField } from '../TextField';
import { Txt } from '../Txt';

/** The exact-time stepper moves in 5-minute steps, from 5 minutes. */
const MINUTE_STEP = 5;

export type WorkoutSheetProps = {
  visible: boolean;
  onClose: () => void;
  target: OrderTarget;
  /** Most minutes that can be logged (past the full goal is fine). */
  maxMinutes: number;
  /** Saves the minutes for the chosen level and the note. */
  onSave: (minutes: number, note: string) => void;
};

const copy = todayCopy.workoutSheet;

/**
 * Logs the workout: pick Hold the line or Conquer, then fine-tune the exact time if it was
 * different (a 90-minute session logs as 90). An optional short note.
 */
export function WorkoutSheet({ visible, onClose, target, maxMinutes, onSave }: WorkoutSheetProps) {
  const styles = useStyles();
  const [minutes, setMinutes] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [wasVisible, setWasVisible] = useState(visible);

  // Start clean every time the sheet opens (adjusting state during render, no effect).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setMinutes(null);
      setNote('');
    }
  }

  const handleSave = () => {
    if (minutes == null) return;
    onSave(minutes, note);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <Txt variant="caption">{copy.subtitle}</Txt>
      <View style={styles.options} accessibilityRole="radiogroup">
        <OptionCard
          title={copy.holdTitle}
          description={copy.holdDescription(target.min)}
          selected={minutes === target.min}
          onPress={() => setMinutes(target.min)}
          leading={<Icon name="workout" color={minutes === target.min ? 'accent' : 'textMuted'} />}
        />
        <OptionCard
          title={copy.conquerTitle}
          description={copy.conquerDescription(target.full)}
          selected={minutes === target.full}
          onPress={() => setMinutes(target.full)}
          leading={<Icon name="flame" color={minutes === target.full ? 'accent' : 'textMuted'} />}
        />
      </View>
      {minutes != null ? (
        <View style={styles.exact}>
          <Stepper
            caption={copy.exactLabel}
            value={minutes}
            onChange={setMinutes}
            min={MINUTE_STEP}
            max={Math.max(maxMinutes, target.full)}
            step={MINUTE_STEP}
            formatValue={copy.minutes}
            accessibilityLabel={copy.exactAccessibility}
          />
        </View>
      ) : null}
      <TextField
        label={copy.noteLabel}
        value={note}
        onChangeText={setNote}
        placeholder={copy.notePlaceholder}
        maxLength={WORKOUT_NOTE_MAX_LENGTH}
        autoCapitalize="sentences"
        returnKeyType="done"
      />
      <View style={styles.actions}>
        <Button label={copy.save} disabled={minutes === null} cue={null} onPress={handleSave} />
        <Button label={copy.cancel} variant="ghost" cue={null} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  options: { gap: theme.space.sm, marginVertical: theme.space.lg },
  exact: { marginBottom: theme.space.lg },
  actions: { marginTop: theme.space.xl, gap: theme.space.xs },
}));
