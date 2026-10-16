import { useState } from 'react';
import { View } from 'react-native';

import { ordersCopy } from '@/copy';
import { FULL_GOAL_RANGES, type OrderTarget, type TunableOrder } from '@/features/orders';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Stepper } from '../Stepper';
import { Txt } from '../Txt';

export type VincoGoalSheetProps = {
  /** The order being edited, or null when closed. Remount with a key per order. */
  kind: TunableOrder | null;
  target: OrderTarget | undefined;
  onClose: () => void;
  /** Saves the new full goal. Returns false when it could not be saved. */
  onSave: (kind: TunableOrder, full: number) => boolean;
  /** Free training: removes the order (the caller confirms). */
  onRemove?: (kind: TunableOrder) => void;
};

const copy = ordersCopy.vincoEdit;

/** How each of Vinco's tunable goals reads: "4 L", "2 meals", "40 min". */
const FORMAT: Record<TunableOrder, (value: number) => string> = {
  water: ordersCopy.vincoGoals.water,
  meal: ordersCopy.vincoGoals.meal,
  workout: ordersCopy.vincoGoals.workout,
};

/**
 * Changes the full goal ("Conquer") of water, meals or the workout, within the onboarding
 * ranges. The minimum is Vinco's and stays, so the day never gets easier to hold.
 */
export function VincoGoalSheet({ kind, target, onClose, onSave, onRemove }: VincoGoalSheetProps) {
  const styles = useStyles();
  // Null until the user changes it, so the sheet always opens on the saved goal.
  const [picked, setPicked] = useState<number | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const name = kind ? ordersCopy.vincoNames[kind] : '';

  const close = () => {
    setPicked(null);
    setHasFailed(false);
    onClose();
  };

  const save = () => {
    if (!kind || !target) return;
    if (!onSave(kind, picked ?? target.full)) {
      setHasFailed(true);
      return;
    }
    close();
  };

  return (
    <BottomSheet visible={kind != null && target != null} onClose={close} title={name}>
      {kind && target ? (
        <>
          <Txt variant="caption">{copy.minimum(FORMAT[kind](target.min))}</Txt>
          <View style={styles.stepper}>
            <Stepper
              caption={copy.conquer}
              value={picked ?? target.full}
              onChange={setPicked}
              {...FULL_GOAL_RANGES[kind]}
              formatValue={FORMAT[kind]}
              accessibilityLabel={copy.adjust(name)}
            />
          </View>
          <Txt variant="caption">{copy.note}</Txt>
          {hasFailed ? (
            <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.error}>
              {copy.failed}
            </Txt>
          ) : null}
          <View style={styles.actions}>
            <Button label={copy.save} cue="confirm" onPress={save} />
            {onRemove ? (
              <Button label={copy.remove(name)} variant="ghost" cue={null} onPress={() => onRemove(kind)} />
            ) : null}
            <Button label={copy.cancel} variant="ghost" cue={null} onPress={close} />
          </View>
        </>
      ) : null}
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  stepper: { marginTop: theme.space.lg, marginBottom: theme.space.md },
  error: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
