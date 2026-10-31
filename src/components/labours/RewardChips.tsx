import { View } from 'react-native';

import { rewardsCopy } from '@/copy';
import type { ClaimPay } from '@/features/labours';
import { type ColorRole, createStyles, useTheme } from '@/theme';

import { Icon, type IconName } from '../Icon';
import { Txt } from '../Txt';

export type RewardChipsProps = {
  /** What a claim would pay now (Truces already resolved against the reserve). */
  pay: ClaimPay;
  /** Fainter, for a claimed or locked reward. */
  isMuted?: boolean;
};

/** A reward as small marks: coin and denarii, laurel and Gloria, shield and Truces. */
export function RewardChips({ pay, isMuted = false }: RewardChipsProps) {
  const styles = useStyles();
  const theme = useTheme();
  const parts = rewardsCopy.rewards.parts(pay);
  const size = theme.layout.iconSizeSmall * 0.85;
  const items: { key: string; icon: IconName; color: ColorRole; text: string }[] = [
    { key: 'denarii', icon: 'coin', color: 'currency', text: parts.denarii },
    { key: 'gloria', icon: 'laurel', color: 'accent', text: parts.gloria },
    ...(parts.truces
      ? [{ key: 'truces', icon: 'shield' as const, color: 'info' as const, text: parts.truces }]
      : []),
  ];

  return (
    <View style={styles.row} accessible accessibilityLabel={rewardsCopy.rewards.describe(pay)}>
      {items.map((item) => (
        <View key={item.key} style={styles.chip}>
          <Icon name={item.icon} size={size} color={isMuted ? 'textFaint' : item.color} />
          <Txt variant="micro" color={isMuted ? 'textFaint' : item.color}>
            {item.text}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xxs },
}));
