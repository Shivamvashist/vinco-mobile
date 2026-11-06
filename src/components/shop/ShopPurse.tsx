import { View } from 'react-native';

import { shopCopy } from '@/copy';
import { createStyles, useTheme } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type ShopPurseProps = {
  balance: number;
  /** Earned in the last 7 days. */
  earnedThisWeek: number;
  /** Hidden on the Earn tab itself. */
  onEarnMore?: () => void;
};

/**
 * The Shop's header card: the purse in big silver numerals on a soft silver light, what came in
 * this week, and a way to the Earn tab.
 */
export function ShopPurse({ balance, earnedThisWeek, onEarnMore }: ShopPurseProps) {
  const styles = useStyles();
  const theme = useTheme();
  const amount = Math.max(0, Math.floor(Number.isFinite(balance) ? balance : 0));

  return (
    <Card glow={{ color: 'currency', origin: 'bottomLeft', intensity: 0.45 }} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.coin}>
          <Icon name="coin" size={theme.layout.iconSize * 1.5} color="currency" strokeWidth={2} />
        </View>
        <View
          style={styles.text}
          accessible
          accessibilityLabel={`${shopCopy.balanceLabel}: ${shopCopy.balance(amount)}`}
        >
          <Txt variant="overline">{shopCopy.balanceLabel}</Txt>
          <Txt
            variant="display"
            color="currency"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={styles.amount}
          >
            {amount.toLocaleString('en-GB')}
          </Txt>
        </View>
      </View>
      <View style={styles.footer}>
        <View
          style={styles.week}
          accessible
          accessibilityLabel={shopCopy.earnedThisWeekLabel(earnedThisWeek)}
        >
          <Txt variant="labelSmall" color="currency" numberOfLines={1}>
            {shopCopy.earnedThisWeek(earnedThisWeek)}
          </Txt>
        </View>
        {onEarnMore ? (
          <Button label={shopCopy.earnMore} variant="secondary" size="compact" onPress={onEarnMore} />
        ) : null}
      </View>
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { gap: theme.space.md, paddingVertical: theme.space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.lg },
  coin: {
    width: theme.layout.ringSize,
    height: theme.layout.ringSize,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.layout.borderWidthStrong,
    borderColor: theme.effects.cardBorder,
    backgroundColor: theme.colors.surfaceSunk,
  },
  text: { flex: 1, minWidth: 0 },
  amount: { fontVariant: ['tabular-nums'] },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  week: {
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
}));
