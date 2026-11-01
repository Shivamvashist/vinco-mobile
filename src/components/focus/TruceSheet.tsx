import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { ItemArt } from '@/components/forum/ItemArt';
import { notify } from '@/components/notices';
import { Txt } from '@/components/Txt';
import { focusCopy, forumCopy } from '@/copy';
import { checkPurchase, denariiShort, getForumItem } from '@/features/forum';
import { useForum } from '@/hooks/useForum';
import { createStyles, useFeedback } from '@/theme';

export type TruceSheetProps = {
  visible: boolean;
  /**
   * retreat: from the running focus, after a refused retreat or a tap on the Truce tile.
   * begin: before a focus begins with no Truce held.
   */
  mode: 'retreat' | 'begin';
  onClose: () => void;
  /** A Truce was bought (the reserve already shows it). */
  onBought: () => void;
  /** begin only: start the focus without a Truce. */
  onBeginAnyway?: () => void;
};

const copy = focusCopy.truce;
const TRUCE = getForumItem('truce');

/**
 * Buys the Forum's Truce from the focus screens: the same item, price and limits (at most 3 held,
 * one bought a day), checked again when bought. One line says what it is for; when it can't be
 * bought, one line says why (and, on a running focus, that it runs to its end). Neutral in every
 * tone.
 */
export function TruceSheet({ visible, mode, onClose, onBought, onBeginAnyway }: TruceSheetProps) {
  const styles = useStyles();
  const play = useFeedback();
  const forum = useForum();
  const [error, setError] = useState<string | null>(null);
  const check = checkPurchase(TRUCE, forum.balance, forum.holdings.truce);
  const blocker =
    check === 'cannotAfford'
      ? copy.cannotAfford(denariiShort(TRUCE, forum.balance))
      : check === 'dailyLimit'
        ? copy.dailyLimit
        : null;
  const line = blocker
    ? mode === 'retreat'
      ? `${blocker} ${copy.runsOn}`
      : blocker
    : mode === 'retreat'
      ? copy.retreatLine
      : copy.beginLine;

  const close = () => {
    setError(null);
    onClose();
  };

  const buy = () => {
    const problem = forum.buy('truce');
    if (problem === null) {
      play('chime');
      setError(null);
      if (mode === 'retreat') notify({ kind: 'success', message: copy.bought });
      onBought();
      return;
    }
    play('denied');
    // Any other refusal shows in the line above, read live.
    setError(problem === 'failed' ? forumCopy.sheet.failed : null);
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={copy.title}>
      <View style={styles.head}>
        <ItemArt itemId="truce" />
        <View style={styles.headText}>
          <Txt variant="label">{forumCopy.items.truce.name}</Txt>
          <Txt variant="labelSmall" color="currency">
            {forumCopy.priceLabel(TRUCE.price)}
          </Txt>
        </View>
      </View>
      <Txt
        variant="body"
        color={blocker ? 'text' : 'textMuted'}
        style={styles.line}
        accessibilityLiveRegion="polite"
      >
        {line}
      </Txt>
      {error ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.line}>
          {error}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        {check === 'ok' ? <Button label={forumCopy.sheet.buy(TRUCE.price)} cue={null} onPress={buy} /> : null}
        {mode === 'begin' && onBeginAnyway ? (
          <Button
            label={copy.beginAnyway}
            variant={check === 'ok' ? 'ghost' : 'primary'}
            cue={null}
            onPress={() => {
              setError(null);
              onBeginAnyway();
            }}
          />
        ) : (
          <Button
            label={copy.back}
            variant={check === 'ok' ? 'ghost' : 'secondary'}
            cue={null}
            onPress={close}
          />
        )}
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md, marginTop: theme.space.sm },
  headText: { flex: 1, gap: theme.space.xxs },
  line: { marginTop: theme.space.lg },
  actions: { marginTop: theme.space.xl, gap: theme.space.xs },
}));
