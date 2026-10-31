import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { arcCopy } from '@/copy';
import type { RankStatus } from '@/features/campaign';
import { useTabReturn } from '@/hooks/useTabReturn';
import { clampProgress } from '@/lib/progress';
import { createStyles, motion, themeTiming, useReduceMotion } from '@/theme';

import { Card } from '../Card';
import { Txt } from '../Txt';

export type RankCardProps = {
  rank: RankStatus;
};

const MEDALLION_SIZE = 56;
const copy = arcCopy.rank;

/** The current rank: medallion, name, what it means, and days to the next. */
export function RankCard({ rank }: RankCardProps) {
  const styles = useStyles();
  const { current, next } = rank;
  const medallionName = current?.name ?? next?.name ?? '';
  const detail = !current
    ? copy.noneDetail
    : next
      ? copy.next(current.meaning, next.name, rank.daysToNext)
      : copy.top(current.meaning);

  return (
    <Card glow={{ color: 'accent', intensity: 0.45 }} style={styles.card}>
      <View style={[styles.medallion, !current && styles.medallionLocked]}>
        <Txt variant="heading" color={current ? 'accent' : 'textFaint'}>
          {medallionName.slice(0, 2)}
        </Txt>
      </View>
      <View style={styles.text}>
        <Txt variant="heading" accessibilityRole="header">
          {current?.name ?? copy.noneTitle}
        </Txt>
        <Txt variant="caption" style={styles.detail}>
          {detail}
        </Txt>
        {next ? (
          <View style={styles.progress}>
            <RankBar value={rank.progress} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

/**
 * The bar towards the next rank, like ProgressBar's regular bar. A change eases to the new value;
 * each time the user comes back to the tab it fills again from empty (never with reduce motion).
 */
function RankBar({ value }: { value: number }) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const progress = clampProgress(value);
  const fill = useSharedValue(progress);

  useEffect(() => {
    fill.set(reduceMotion ? progress : withTiming(progress, themeTiming('base')));
  }, [fill, progress, reduceMotion]);

  useTabReturn(() => {
    if (reduceMotion) return;
    fill.set(0);
    fill.set(withDelay(motion.duration.instant, withTiming(progress, themeTiming('slow'))));
  });

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={copy.progressLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  card: { flexDirection: 'row', alignItems: 'center', gap: theme.layout.cardPadding },
  medallion: {
    width: MEDALLION_SIZE,
    height: MEDALLION_SIZE,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionLocked: { borderColor: theme.colors.borderStrong, borderStyle: 'dashed' },
  text: { flex: 1, minWidth: 0 },
  detail: { marginTop: theme.space.xxs },
  progress: { marginTop: theme.space.sm },
  track: {
    width: '100%',
    height: theme.layout.barHeightRegular,
    overflow: 'hidden',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  fill: { height: '100%', borderRadius: theme.radius.pill, backgroundColor: theme.colors.accent },
}));
