import { View } from 'react-native';

import { guardCopy } from '@/copy';
import { getReelBadgeStage, type ReelBadgeStage } from '@/features/guard';
import { cardSurface, type ColorRole, createStyles, useTheme } from '@/theme';

import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Txt } from '../Txt';

export type ReelCountCardProps = {
  count: number;
  /** The budget plus today's passes. */
  allowance: number;
  /** The guard service: on, off, or null while it is being read. */
  isServiceOn: boolean | null;
  /** Opens the reel counter (/reels). */
  onPress: () => void;
};

const copy = guardCopy.reels;

const STAGE_COLORS: Record<ReelBadgeStage, ColorRole> = {
  calm: 'text',
  near: 'accent',
  over: 'danger',
};

/**
 * Today's reels on the guard screen, as one compact row that opens the reel counter (/reels),
 * where the log, the pass and the settings live. The number takes the badge's colours: marble,
 * gold from 80% of the allowance, porphyry past it. With the guard service off it says so.
 */
export function ReelCountCard({ count, allowance, isServiceOn, onPress }: ReelCountCardProps) {
  const styles = useStyles();
  const theme = useTheme();
  const stage = getReelBadgeStage(count, allowance);
  const label = copy.countLabel(count, allowance);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={isServiceOn === false ? `${label}. ${copy.offTitle}` : label}
      accessibilityHint={copy.openHint}
      onPress={onPress}
      scaleTo="card"
      style={styles.card}
    >
      <View style={styles.text}>
        <Txt variant="heading" color={STAGE_COLORS[stage]} numberOfLines={1}>
          {copy.count(count, allowance)}
        </Txt>
        {isServiceOn === false ? (
          <Txt variant="caption" color="danger">
            {copy.offTitle}
          </Txt>
        ) : null}
      </View>
      <Icon name="forward" color="textMuted" size={theme.layout.iconSize} />
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    ...cardSurface(theme),
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    padding: theme.layout.cardPadding,
    minHeight: theme.layout.minTouchTarget,
  },
  text: { flex: 1, gap: theme.space.xxs },
}));
