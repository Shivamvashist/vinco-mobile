import { View } from 'react-native';

import { todayCopy } from '@/copy';
import type { TrucePayment } from '@/features/campaign';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Txt } from '../Txt';

export type SickDaySheetProps = {
  visible: boolean;
  onClose: () => void;
  /** How one Truce would be paid for right now. */
  payment: TrucePayment;
  reserve: number;
  denarii: number;
  /** Shown under the cost when the last attempt failed. */
  error: string | null;
  onConfirm: () => void;
};

const copy = todayCopy.sickDay;

/** "Feeling sick?": what a sick-day Truce does and exactly what it costs, before calling it. */
export function SickDaySheet({
  visible,
  onClose,
  payment,
  reserve,
  denarii,
  error,
  onConfirm,
}: SickDaySheetProps) {
  const styles = useStyles();
  const cost = !payment.canAfford
    ? copy.cannotAfford(payment.cost, Math.max(0, denarii))
    : payment.toBuy > 0
      ? copy.bought(payment.cost, denarii)
      : copy.fromReserve(reserve);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.sheetTitle}>
      <Txt variant="body" color="textMuted">
        {copy.sheetBody}
      </Txt>
      <Txt variant="label" color={payment.canAfford ? 'text' : 'danger'} style={styles.cost}>
        {cost}
      </Txt>
      {error ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.error}>
          {error}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        {payment.canAfford ? <Button label={copy.confirm} cue="truce" onPress={onConfirm} /> : null}
        <Button
          label={copy.cancel}
          variant={payment.canAfford ? 'ghost' : 'secondary'}
          cue={null}
          onPress={onClose}
        />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  cost: { marginTop: theme.space.lg },
  error: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
