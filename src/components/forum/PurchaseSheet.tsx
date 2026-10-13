import { View } from 'react-native';

import { forumCopy } from '@/copy';
import { checkPurchase, denariiShort, type ForumItem, type Holding } from '@/features/forum';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Txt } from '../Txt';
import { ItemArt } from './ItemArt';

export type PurchaseSheetProps = {
  /** The item being looked at, or null when closed. */
  item: ForumItem | null;
  holding: Holding | null;
  balance: number;
  error: string | null;
  onBuy: () => void;
  onClose: () => void;
};

const sheet = forumCopy.sheet;

/**
 * The buy step: what the item does, its limits, the balance after, and one button that says
 * exactly why it is not for sale right now ("Need 20 more", "Reserve full").
 */
export function PurchaseSheet({ item, holding, balance, error, onBuy, onClose }: PurchaseSheetProps) {
  const styles = useStyles();
  const copy = item ? forumCopy.items[item.id] : null;
  const check = item && holding ? checkPurchase(item, balance, holding) : 'cannotAfford';

  return (
    <BottomSheet visible={item != null} onClose={onClose} title={copy?.name}>
      {item && copy ? (
        <>
          <View style={styles.head}>
            <ItemArt itemId={item.id} />
            <View style={styles.headText}>
              {copy.latin ? <Txt variant="micro">{copy.latin}</Txt> : null}
              <Txt variant="label" color="currency">
                {forumCopy.priceLabel(item.price)}
              </Txt>
            </View>
          </View>
          <Txt variant="body" color="textMuted" style={styles.description}>
            {copy.description}
          </Txt>
          <Txt variant="caption" style={styles.line}>
            {describeRule(item)}
          </Txt>
          {check === 'ok' ? (
            <Txt variant="caption" color="currency" style={styles.line}>
              {sheet.balanceAfter(balance - item.price)}
            </Txt>
          ) : null}
          {error ? (
            <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.line}>
              {error}
            </Txt>
          ) : null}
          <View style={styles.actions}>
            <Button
              label={describeAction(item, check, balance)}
              cue={null}
              disabled={check !== 'ok'}
              onPress={onBuy}
            />
            <Button label={sheet.cancel} variant="ghost" cue={null} onPress={onClose} />
          </View>
        </>
      ) : null}
    </BottomSheet>
  );
}

function describeRule(item: ForumItem): string {
  if (item.id === 'truce') return sheet.truceRule(item.maxHeld);
  if (item.id === 'venia') return sheet.veniaRule(item.maxHeld);
  return sheet.cosmeticRule;
}

/** The button's words: the price when it can be bought, otherwise the reason it can't. */
function describeAction(item: ForumItem, check: ReturnType<typeof checkPurchase>, balance: number): string {
  switch (check) {
    case 'ok':
      return sheet.buy(item.price);
    case 'cannotAfford':
      return sheet.needMore(denariiShort(item, balance));
    case 'full':
      return sheet.full;
    case 'dailyLimit':
      return sheet.dailyLimit;
    case 'owned':
      return sheet.owned;
  }
}

const useStyles = createStyles((theme) => ({
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md, marginTop: theme.space.sm },
  headText: { flex: 1, gap: theme.space.xxs },
  description: { marginTop: theme.space.lg },
  line: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.xl, gap: theme.space.xs },
}));
