import { View } from 'react-native';

import { shopCopy } from '@/copy';
import { createStyles, useTheme } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type PriceTagProps = {
  price: number;
  /** Owned for good: a gold check and "Owned" instead of the price. */
  isOwned?: boolean;
};

/** The price on a Shop item: a silver coin and the amount on a sunk pill, or "Owned" in gold. Decorative. */
export function PriceTag({ price, isOwned = false }: PriceTagProps) {
  const styles = useStyles();
  const theme = useTheme();
  const size = theme.layout.iconSizeSmall;
  if (isOwned) {
    return (
      <View style={[styles.tag, styles.owned]}>
        <Icon name="check" size={size} color="accent" strokeWidth={2.2} />
        <Txt variant="labelSmall" color="accent" numberOfLines={1}>
          {shopCopy.status.owned}
        </Txt>
      </View>
    );
  }
  return (
    <View style={styles.tag}>
      <Icon name="coin" size={size} color="currency" strokeWidth={2} />
      <Txt variant="label" color="currency" numberOfLines={1} style={styles.amount}>
        {shopCopy.price(price)}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
    backgroundColor: theme.colors.surfaceSunk,
  },
  owned: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accentBorder },
  amount: { fontVariant: ['tabular-nums'] },
}));
