import { useState } from 'react';
import { View } from 'react-native';

import { ordersCopy } from '@/copy';
import {
  CUSTOM_ORDER_LIMITS,
  type CustomOrderDraft,
  type CustomOrderError,
  toCustomOrderDraft,
} from '@/features/orders';
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
  /** The name to start with (a task becoming an order). Remount with a key to reset it. */
  initialName?: string;
};

/** Longest number typed into the count field (9999). */
const COUNT_MAX_DIGITS = String(CUSTOM_ORDER_LIMITS.maxGoal).length;

/** A typed count as a number. Anything that isn't plain digits is NaN, so validation catches it. */
export function parseCount(text: string): number {
  const trimmed = text.trim();
  return /^[0-9]+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/**
 * Adds one of the user's own orders: what, its unit, and how many a day ("Drink water", "glass",
 * 12). Errors show under the fields; the sheet only closes once the order is saved.
 */
export function AddOrderSheet({ visible, onClose, onSave, initialName = '' }: AddOrderSheetProps) {
  const styles = useStyles();
  const play = useFeedback();
  const copy = ordersCopy.add;
  const [name, setName] = useState(initialName);
  const [unit, setUnit] = useState('');
  const [count, setCount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const parsed = parseCount(count);

  const reset = () => {
    setName('');
    setUnit('');
    setCount('');
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const save = () => {
    const result = onSave(toCustomOrderDraft(name, unit, parsed));
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
        <View style={styles.pair}>
          <View style={styles.unit}>
            <TextField
              label={copy.unitLabel}
              value={unit}
              onChangeText={edit(setUnit)}
              placeholder={copy.unitPlaceholder}
              maxLength={CUSTOM_ORDER_LIMITS.unitMaxLength}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.count}>
            <TextField
              label={copy.countLabel}
              value={count}
              onChangeText={edit(setCount)}
              placeholder={copy.countPlaceholder}
              keyboardType="number-pad"
              maxLength={COUNT_MAX_DIGITS}
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>
        </View>
        {Number.isFinite(parsed) && parsed > 0 ? (
          <Txt variant="caption" color="accent">
            {copy.preview(parsed, unit.trim())}
          </Txt>
        ) : null}
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
  pair: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md },
  unit: { flexGrow: 1, flexBasis: 120 },
  count: { flexGrow: 1, flexBasis: 120 },
  error: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
