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

/** An existing order being edited: its values fill the fields. */
export type OrderEditValues = {
  name: string;
  unit: string;
  /** How many a day; null for a done-or-not order (the field starts empty). */
  count: number | null;
  /** Today's minimum: a lower number waits for tomorrow, and the sheet says so. Null if it applies at once. */
  todayMin: number | null;
  /** An older order with a separate minimum and full goal, which saving turns into one number. */
  isTwoLevel: boolean;
};

export type AddOrderSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Saves the order. Returns null when saved, or why it was refused. */
  onSave: (draft: CustomOrderDraft) => CustomOrderError | 'failed' | null;
  /** The name to start with (a task becoming an order). Remount with a key to reset it. */
  initialName?: string;
  /** Edit an existing order instead of adding one. Remount with a key per order. */
  editing?: OrderEditValues;
  /** Edit mode: stands the order down (the caller confirms). */
  onStandDown?: () => void;
};

/** Longest number typed into the count field (9999). */
const COUNT_MAX_DIGITS = String(CUSTOM_ORDER_LIMITS.maxGoal).length;

/** A typed count as a number. Anything that isn't plain digits is NaN, so validation catches it. */
export function parseCount(text: string): number {
  const trimmed = text.trim();
  return /^[0-9]+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/**
 * Adds or edits one of the user's own orders: what, its unit, and how many a day ("Drink water",
 * "glass", 12). Unit and number are optional: left empty, it is a done-or-not order. Errors show
 * under the fields; the sheet only closes once the order is saved.
 */
export function AddOrderSheet({
  visible,
  onClose,
  onSave,
  initialName = '',
  editing,
  onStandDown,
}: AddOrderSheetProps) {
  const styles = useStyles();
  const play = useFeedback();
  const copy = ordersCopy.add;
  const editCopy = ordersCopy.edit;
  const [name, setName] = useState(editing?.name ?? initialName);
  const [unit, setUnit] = useState(editing?.unit ?? '');
  const [count, setCount] = useState(editing?.count != null ? String(editing.count) : '');
  const [error, setError] = useState<string | null>(null);
  const isCountEmpty = count.trim() === '';
  const parsed = isCountEmpty ? null : parseCount(count);
  const goal = parsed ?? 1;
  const isLowered = editing?.todayMin != null && Number.isFinite(goal) && goal > 0 && goal < editing.todayMin;

  const reset = () => {
    setName(editing?.name ?? '');
    setUnit(editing?.unit ?? '');
    setCount(editing?.count != null ? String(editing.count) : '');
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
      // Adding stays ready for the next one; an edit is closed by the caller.
      if (!editing) reset();
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
    <BottomSheet visible={visible} onClose={close} title={editing ? editCopy.title : copy.title}>
      <Txt variant="caption">{editing ? editCopy.body : copy.body}</Txt>
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
        <Txt variant="caption" color={Number.isFinite(goal) && goal > 0 ? 'accent' : 'textMuted'}>
          {isCountEmpty && unit.trim() === ''
            ? copy.previewCheck
            : Number.isFinite(goal) && goal > 0
              ? copy.preview(goal, unit.trim())
              : copy.optionalHint}
        </Txt>
        {isLowered ? <Txt variant="caption">{editCopy.lowerNote}</Txt> : null}
        {editing?.isTwoLevel ? <Txt variant="caption">{editCopy.twoLevelNote}</Txt> : null}
      </View>
      {error ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.error}>
          {error}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button label={editing ? editCopy.save : copy.save} cue={null} onPress={save} />
        {editing && onStandDown ? (
          <Button label={editCopy.standDown} variant="ghost" cue={null} onPress={onStandDown} />
        ) : null}
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
