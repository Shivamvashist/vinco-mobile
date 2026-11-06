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
  /** inline: marks in a row (decoration tiles). pills: each on its own soft pill, like loot (quests). */
  look?: 'inline' | 'pills';
};

type Chip = { key: string; icon: IconName; color: ColorRole; fill: ColorRole; text: string };

/** A reward as small marks: coin and denarii, laurel and Gloria, shield and Truces. */
export function RewardChips({ pay, isMuted = false, look = 'inline' }: RewardChipsProps) {
  const styles = useStyles();
  const theme = useTheme();
  const parts = rewardsCopy.rewards.parts(pay);
  const size = theme.layout.iconSizeSmall * 0.85;
  const items: Chip[] = [
    { key: 'denarii', icon: 'coin', color: 'currency', fill: 'surfaceSunk', text: parts.denarii },
    { key: 'gloria', icon: 'laurel', color: 'accent', fill: 'accentSoft', text: parts.gloria },
  ];
  if (parts.truces) {
    items.push({ key: 'truces', icon: 'shield', color: 'info', fill: 'surfaceSunk', text: parts.truces });
  }
  const isPills = look === 'pills';

  return (
    <View style={styles.row} accessible accessibilityLabel={rewardsCopy.rewards.describe(pay)}>
      {items.map((item) => (
        <View
          key={item.key}
          style={[
            styles.chip,
            isPills && styles.pill,
            isPills && { backgroundColor: theme.colors[isMuted ? 'surfaceSunk' : item.fill] },
          ]}
        >
          <Icon
            name={item.icon}
            size={size}
            color={isMuted ? 'textFaint' : item.color}
            strokeWidth={isPills ? 2 : undefined}
          />
          <Txt variant={isPills ? 'labelSmall' : 'micro'} color={isMuted ? 'textFaint' : item.color}>
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
  pill: {
    gap: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xxs,
    borderRadius: theme.radius.pill,
  },
}));
