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
import { TextField } from '../TextField';
import { Txt } from '../Txt';

type WorkoutLevel = 'min' | 'full';

export type WorkoutSheetProps = {
  visible: boolean;
  onClose: () => void;
  target: OrderTarget;
  /** Saves the minutes for the chosen level and the note. */
  onSave: (minutes: number, note: string) => void;
};

const copy = todayCopy.workoutSheet;

/**
 * Logs the workout at the minimum or the full goal, with an optional short note.
 * Typed for now; the voice note arrives with the recorder in Step 8.
 */
export function WorkoutSheet({ visible, onClose, target, onSave }: WorkoutSheetProps) {
  const styles = useStyles();
  const [level, setLevel] = useState<WorkoutLevel | null>(null);
  const [note, setNote] = useState('');
  const [wasVisible, setWasVisible] = useState(visible);

  // Start clean every time the sheet opens (adjusting state during render, no effect).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setLevel(null);
      setNote('');
    }
  }

  const handleSave = () => {
    if (!level) return;
    onSave(level === 'full' ? target.full : target.min, note);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <Txt variant="caption">{copy.subtitle}</Txt>
      <View style={styles.options} accessibilityRole="radiogroup">
        <OptionCard
          title={copy.holdTitle}
          description={copy.holdDescription(target.min)}
          selected={level === 'min'}
          onPress={() => setLevel('min')}
          leading={<Icon name="workout" color={level === 'min' ? 'accent' : 'textMuted'} />}
        />
        <OptionCard
          title={copy.conquerTitle}
          description={copy.conquerDescription(target.full)}
          selected={level === 'full'}
          onPress={() => setLevel('full')}
          leading={<Icon name="flame" color={level === 'full' ? 'accent' : 'textMuted'} />}
        />
      </View>
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
        <Button label={copy.save} disabled={level === null} cue={null} onPress={handleSave} />
        <Button label={copy.cancel} variant="ghost" cue={null} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  options: { gap: theme.space.sm, marginVertical: theme.space.lg },
  actions: { marginTop: theme.space.xl, gap: theme.space.xs },
}));
