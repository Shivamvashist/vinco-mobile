import { useState } from 'react';
import { View } from 'react-native';

import { ordersCopy } from '@/copy';
import { CUSTOM_ORDER_LIMITS, type CustomOrder } from '@/features/orders';
import { createStyles, useFeedback } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { Txt } from '../Txt';

import { parseCount } from './AddOrderSheet';

export type OrderAmountSheetProps = {
  /** The own order being set, or null when closed. Remount with a key per order. */
  order: CustomOrder | null;
  amount: number;
  onClose: () => void;
  /** Saves today's amount (kept between 0 and the goal by the caller). */
  onSave: (amount: number) => void;
};

/** Types today's amount for an own order: big goals (10000 steps), or a quick fix. */
export function OrderAmountSheet({ order, amount, onClose, onSave }: OrderAmountSheetProps) {
  const styles = useStyles();
  const play = useFeedback();
  const copy = ordersCopy.amount;
  const [text, setText] = useState(amount > 0 ? String(amount) : '');
  const [hasError, setHasError] = useState(false);

  const save = () => {
    const value = text.trim() === '' ? 0 : parseCount(text);
    if (!Number.isFinite(value)) {
      play('denied');
      setHasError(true);
      return;
    }
    onSave(value);
  };

  return (
    <BottomSheet visible={order != null} onClose={onClose} title={order ? copy.title(order.name) : undefined}>
      {order ? (
        <>
          <Txt variant="caption">{copy.goal(order.full, order.unit)}</Txt>
          <View style={styles.field}>
            <TextField
              label={copy.label(order.unit)}
              value={text}
              onChangeText={(next) => {
                setText(next);
                setHasError(false);
              }}
              keyboardType="number-pad"
              maxLength={String(CUSTOM_ORDER_LIMITS.maxGoal).length}
              returnKeyType="done"
              onSubmitEditing={save}
              autoFocus
            />
          </View>
          {hasError ? (
            <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.error}>
              {copy.invalid}
            </Txt>
          ) : null}
          <View style={styles.actions}>
            <Button label={copy.save} cue={null} onPress={save} />
            <Button label={copy.cancel} variant="ghost" cue={null} onPress={onClose} />
          </View>
        </>
      ) : null}
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  field: { marginTop: theme.space.lg },
  error: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
