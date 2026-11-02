import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { commonCopy, todayCopy } from '@/copy';
import type { PathPoint, PathSpan, SkyBody } from '@/features/dayPath';
import { useCrossFade } from '@/hooks/useCrossFade';
import { useHeroFace } from '@/hooks/useHeroFace';
import { useTabSettle } from '@/hooks/useTabSettle';
import { cardSurface, createStyles, useTheme } from '@/theme';

import { Button } from '../../Button';
import { Glow } from '../../Glow';
import { PressableScale } from '../../PressableScale';
import { RollingNumber } from '../../RollingNumber';
import { Txt } from '../../Txt';
import { DayPath } from './DayPath';

export type DiesState = keyof typeof todayCopy.hero.states;

export type DiesCardProps = {
  state: DiesState;
  held: number;
  total: number;
  /** Now on the day, 0 (wake-up) to 1 (midnight). */
  progress: number;
  /** Each activity of the day, on the same scale. */
  marks: readonly PathPoint[];
  /** Each focus of the day, as a stretch on the same scale. */
  spans: readonly PathSpan[];
  /** The day shown (its key), and whether its activity has been read. */
  day: string;
  isActivityLoaded: boolean;
  /** The marks in words for screen readers ("5 activities today, last at 4:12 pm."), or empty. */
  activityLabel: string;
  /** The sky view: the sun or the moon, and the minutes left in the day. */
  body: SkyBody;
  minutesLeft: number;
  onPress: () => void;
  /** On a sick day: takes the Truce back. */
  onFeelingBetter?: () => void;
};

/** The glow's strength by state: dim while open, warmer once held, full when conquered. */
const GLOW: Record<DiesState, number> = {
  open: 0.45,
  held: 0.75,
  conquered: 1,
  sick: 0.25,
  finished: 0.6,
};

const copy = todayCopy.hero;

/**
 * Dies (the day): Today's hero. A state pill, one big number (orders held, "2/4") over the day's
 * path, marked where each thing was done today. After a few seconds the number gives way to the
 * sky: the sun or moon rides the path at now, over the time left in the day. Tap for today's
 * summary. On a sick day a quiet "I'm feeling better" sits at the top right.
 */
export function DiesCard({
  state,
  held,
  total,
  progress,
  marks,
  spans,
  day,
  isActivityLoaded,
  activityLabel,
  body,
  minutesLeft,
  onPress,
  onFeelingBetter,
}: DiesCardProps) {
  const theme = useTheme();
  const styles = useStyles();
  const face = useHeroFace();
  const sky = useCrossFade(face === 'sky');
  const countStyle = useAnimatedStyle(() => ({ opacity: 1 - sky.get() }));
  const skyStyle = useAnimatedStyle(() => ({ opacity: sky.get() }));
  // First in Veni's return stagger: the hero settles, then the tiles under it.
  const settleStyle = useTabSettle(0);
  const isHeld = state === 'held' || state === 'conquered';

  return (
    <Animated.View style={settleStyle}>
      <PressableScale
        scaleTo="card"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={copy.accessibleLabel(held, total, copy.states[state], activityLabel)}
        style={styles.card}
      >
        <Glow color="accent" intensity={GLOW[state]} />
        <View style={styles.top} importantForAccessibility="no-hide-descendants">
          <View style={[styles.pill, isHeld && styles.pillHeld]}>
            <Txt variant="micro" color={isHeld ? 'onAccent' : 'textMuted'}>
              {copy.states[state]}
            </Txt>
          </View>
        </View>

        <View style={styles.centre} importantForAccessibility="no-hide-descendants" pointerEvents="none">
          <Animated.View style={[styles.count, countStyle]}>
            <RollingNumber value={String(held)} variant="hero" color={isHeld ? 'accent' : 'text'} />
            {total > 0 ? (
              <Txt variant="heading" color="textMuted" style={styles.of}>
                {copy.of(total)}
              </Txt>
            ) : null}
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.sky, skyStyle]}>
            <RollingNumber
              value={commonCopy.duration(minutesLeft)}
              variant="display"
              style={styles.centred}
              fit
            />
            <Txt variant="caption">{copy.left}</Txt>
          </Animated.View>
        </View>

        <View style={{ marginHorizontal: -theme.space.xs }}>
          <DayPath
            progress={progress}
            marks={marks}
            spans={spans}
            day={day}
            isLoaded={isActivityLoaded}
            isHeld={isHeld}
            sky={sky}
            body={body}
          />
        </View>
      </PressableScale>
      {onFeelingBetter ? (
        <View style={styles.better}>
          <Button
            label={todayCopy.sickDay.better}
            variant="ghost"
            size="compact"
            cue="stepDown"
            accessibilityHint={todayCopy.sickDay.betterHint}
            onPress={onFeelingBetter}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    minHeight: theme.layout.heroCardHeight,
    padding: theme.layout.cardPadding,
    paddingBottom: theme.space.sm,
    ...cardSurface(theme),
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  top: { flexDirection: 'row', alignItems: 'center', minHeight: theme.layout.minTouchTarget },
  pill: {
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xxs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
  pillHeld: { backgroundColor: theme.colors.accent },
  centre: { alignItems: 'center', justifyContent: 'center' },
  count: { flexDirection: 'row', alignItems: 'baseline' },
  of: { marginLeft: theme.space.xxs },
  centred: { textAlign: 'center' },
  sky: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.space.xl },
  // Over the card's top right corner, level with the pill; outside the card's own press.
  better: { position: 'absolute', top: 0, right: theme.space.xs },
}));
