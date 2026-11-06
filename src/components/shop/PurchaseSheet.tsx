import { View } from 'react-native';

import { shopCopy } from '@/copy';
import { checkPurchase, denariiShort, type ForumItem, type Holding } from '@/features/forum';
import { type ColorRole, createStyles, useTheme } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Glow } from '../Glow';
import { Icon } from '../Icon';
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

const sheet = shopCopy.sheet;

/**
 * The buy step: the item on a lit stage, what it does and its limits, a small receipt (price, in
 * your purse, left after) and one button that says exactly why it is not for sale right now
 * ("Need 20 more", "Reserve full").
 */
export function PurchaseSheet({ item, holding, balance, error, onBuy, onClose }: PurchaseSheetProps) {
  const styles = useStyles();
  const copy = item ? shopCopy.items[item.id] : null;
  const check = item && holding ? checkPurchase(item, balance, holding) : 'cannotAfford';
  const purse = Math.max(0, Math.floor(Number.isFinite(balance) ? balance : 0));

  return (
    <BottomSheet visible={item != null} onClose={onClose} title={copy?.name}>
      {item && copy ? (
        <>
          <View style={styles.stage}>
            <Glow color="accent" intensity={0.5} />
            <ItemArt itemId={item.id} size="large" />
            {copy.latin ? (
              <Txt variant="micro" align="center">
                {copy.latin}
              </Txt>
            ) : null}
          </View>
          <Txt variant="body" color="textMuted" style={styles.description}>
            {copy.description}
          </Txt>
          <Txt variant="caption" style={styles.line}>
            {describeRule(item)}
          </Txt>

          {check === 'owned' ? null : (
            <View
              style={styles.receipt}
              accessible
              accessibilityLabel={
                check === 'ok'
                  ? `${shopCopy.priceLabel(item.price)}. ${sheet.balanceAfter(purse - item.price)}`
                  : shopCopy.priceLabel(item.price)
              }
            >
              <ReceiptLine label={sheet.price} amount={item.price} color="currency" />
              <ReceiptLine label={sheet.inPurse} amount={purse} color="text" />
              {check === 'ok' ? (
                <ReceiptLine label={sheet.leftAfter} amount={purse - item.price} color="currency" isTotal />
              ) : null}
            </View>
          )}
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

type ReceiptLineProps = { label: string; amount: number; color: ColorRole; isTotal?: boolean };

/** One line of the receipt: the label, then a coin and the amount at the right. */
function ReceiptLine({ label, amount, color, isTotal = false }: ReceiptLineProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <View style={[styles.receiptLine, isTotal && styles.total]}>
      <Txt variant={isTotal ? 'label' : 'caption'} style={styles.receiptLabel}>
        {label}
      </Txt>
      <Icon name="coin" size={theme.layout.iconSizeSmall} color="currency" />
      <Txt variant="label" color={color} style={styles.receiptAmount}>
        {amount}
      </Txt>
    </View>
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
  stage: {
    alignItems: 'center',
    gap: theme.space.sm,
    marginTop: theme.space.sm,
    paddingVertical: theme.space.xl,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSunk,
  },
  description: { marginTop: theme.space.lg },
  line: { marginTop: theme.space.sm },
  receipt: {
    marginTop: theme.space.lg,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
  },
  receiptLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    paddingVertical: theme.space.xs,
  },
  total: {
    marginTop: theme.space.xs,
    paddingTop: theme.space.sm,
    borderTopWidth: theme.layout.hairline,
    borderTopColor: theme.colors.border,
  },
  receiptLabel: { flex: 1 },
  receiptAmount: { minWidth: theme.layout.minTouchTarget, textAlign: 'right', fontVariant: ['tabular-nums'] },
  actions: { marginTop: theme.space.xl, gap: theme.space.xs },
}));
