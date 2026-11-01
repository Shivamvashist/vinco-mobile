import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { reelsCopy } from '@/copy';
import { checkReelPass, REEL_PASS, type ReelPassCheck, reelPassShort } from '@/features/guard';
import { createStyles } from '@/theme';

export type ReelPassSheetProps = {
  visible: boolean;
  /** Passes used today. */
  passes: number;
  balance: number;
  /** At Pax nothing blocks: the sheet says a pass changes nothing (it can still be bought). */
  isPax: boolean;
  error: string | null;
  onBuy: () => void;
  onClose: () => void;
};

const copy = reelsCopy.sheet;

/**
 * The confirm step for a reel pass: what it gives, how many are used today, the balance after,
 * and one button that says why it can't be bought when it can't ("Need 8 more denarii").
 */
export function ReelPassSheet({
  visible,
  passes,
  balance,
  isPax,
  error,
  onBuy,
  onClose,
}: ReelPassSheetProps) {
  const styles = useStyles();
  const check = checkReelPass(balance, passes);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <Txt variant="label" color="currency" style={styles.price}>
        {copy.price}
      </Txt>
      <Txt variant="body" color="textMuted" style={styles.line}>
        {copy.body}
      </Txt>
      <Txt variant="caption" style={styles.line}>
        {copy.rule(passes)}
      </Txt>
      {isPax ? (
        <Txt variant="caption" style={styles.line}>
          {copy.paxNote}
        </Txt>
      ) : null}
      {check === 'ok' ? (
        <Txt variant="caption" color="currency" style={styles.line}>
          {copy.balanceAfter(Math.floor(balance) - REEL_PASS.price)}
        </Txt>
      ) : null}
      {error ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.line}>
          {error}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button label={actionLabel(check, balance)} cue={null} disabled={check !== 'ok'} onPress={onBuy} />
        <Button label={copy.cancel} variant="ghost" cue={null} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

function actionLabel(check: ReelPassCheck, balance: number): string {
  switch (check) {
    case 'ok':
      return copy.buy;
    case 'cannotAfford':
      return copy.needMore(reelPassShort(balance));
    case 'dailyLimit':
      return copy.dailyLimit;
  }
}

const useStyles = createStyles((theme) => ({
  price: { marginTop: theme.space.xs },
  line: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.xl, gap: theme.space.xs },
}));
