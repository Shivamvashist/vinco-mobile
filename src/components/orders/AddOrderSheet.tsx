import { useState } from 'react';
import { View } from 'react-native';

import { ordersCopy } from '@/copy';
import { CUSTOM_ORDER_LIMITS, type CustomOrderDraft, type CustomOrderError } from '@/features/orders';
import { createStyles, useFeedback } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { Txt } from '../Txt';

export type AddOrderSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Saves the order. Returns null when saved, or why it was refused. */
  onSave: (draft: CustomOrderDraft) => CustomOrderError | 'failed' | null;
};

/** Longest number typed into a goal field (9999). */
const GOAL_MAX_DIGITS = String(CUSTOM_ORDER_LIMITS.maxGoal).length;

/** A typed goal as a number. Anything that isn't plain digits is NaN, so validation catches it. */
function parseGoal(text: string): number {
  const trimmed = text.trim();
  return /^[0-9]+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/**
 * Adds one of the user's own orders: a name, an optional unit, a minimum and a full goal.
 * Errors show under the fields; the sheet only closes once the order is saved.
 */
export function AddOrderSheet({ visible, onClose, onSave }: AddOrderSheetProps) {
  const styles = useStyles();
  const play = useFeedback();
  const copy = ordersCopy.add;
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [min, setMin] = useState('');
  const [full, setFull] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setUnit('');
    setMin('');
    setFull('');
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const save = () => {
    const result = onSave({ name, unit, min: parseGoal(min), full: parseGoal(full) });
    if (result === null) {
      play('confirm');
      reset();
      return;
    }
    play('denied');
    setError(result === 'failed' ? copy.failed : copy.errors[result]);
  };

  const edit = (setter: (text: string) => void) => (text: string) => {
    setter(text);
    setError(null);
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={copy.title}>
      <Txt variant="caption">{copy.body}</Txt>
      <View style={styles.fields}>
        <TextField
          label={copy.nameLabel}
          value={name}
          onChangeText={edit(setName)}
          placeholder={copy.namePlaceholder}
          maxLength={CUSTOM_ORDER_LIMITS.nameMaxLength}
          autoCapitalize="sentences"
        />
        <TextField
          label={copy.unitLabel}
          value={unit}
          onChangeText={edit(setUnit)}
          placeholder={copy.unitPlaceholder}
          maxLength={CUSTOM_ORDER_LIMITS.unitMaxLength}
          autoCapitalize="none"
        />
        <View style={styles.goals}>
          <View style={styles.goal}>
            <TextField
              label={copy.minLabel}
              value={min}
              onChangeText={edit(setMin)}
              placeholder="10"
              keyboardType="number-pad"
              maxLength={GOAL_MAX_DIGITS}
            />
          </View>
          <View style={styles.goal}>
            <TextField
              label={copy.fullLabel}
              value={full}
              onChangeText={edit(setFull)}
              placeholder="30"
              keyboardType="number-pad"
              maxLength={GOAL_MAX_DIGITS}
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>
        </View>
      </View>
      {error ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.error}>
          {error}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button label={copy.save} cue={null} onPress={save} />
        <Button label={copy.cancel} variant="ghost" cue={null} onPress={close} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  fields: { marginTop: theme.space.lg, gap: theme.space.md },
  goals: { flexDirection: 'row', gap: theme.space.md },
  goal: { flex: 1 },
  error: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
