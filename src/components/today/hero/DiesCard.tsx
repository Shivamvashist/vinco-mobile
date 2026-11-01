import { View } from 'react-native';

import { todayCopy } from '@/copy';
import type { PathPoint, PathSpan } from '@/features/dayPath';
import { cardSurface, createStyles, useTheme } from '@/theme';

import { PressableScale } from '../../PressableScale';
import { RollingNumber } from '../../RollingNumber';
import { Txt } from '../../Txt';
import { DayPath } from './DayPath';
import { Glow } from '../../Glow';

export type DiesState = keyof typeof todayCopy.hero.states;

export type DiesCardProps = {
  state: DiesState;
  held: number;
  total: number;
  /** Denarii paid live for today. */
  earned: number;
  /** Before dawn: the planned wake time to show instead of the count ("6:30 am"). */
  plannedWake: string | null;
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
  /** Free training: the run (days in a row) to name in place of "Today", or null for none. */
  runDays?: number | null;
  onPress: () => void;
};

/** The glow's strength by state: dim while open, warmer once held, full when conquered. */
const GLOW: Record<DiesState, number> = {
  open: 0.45,
  held: 0.75,
  conquered: 1,
  sick: 0.25,
  dawn: 0.3,
  finished: 0.6,
};

const copy = todayCopy.hero;

/**
 * Dies (the day): Today's hero. One big number (orders held) over the sun's path from wake-up to
 * midnight, marked where each thing was done today, lit from below in the palette's accent; the light grows as the day holds. Tap for
 * today's summary.
 */
export function DiesCard({
  state,
  held,
  total,
  earned,
  plannedWake,
  progress,
  marks,
  spans,
  day,
  isActivityLoaded,
  activityLabel,
  runDays = null,
  onPress,
}: DiesCardProps) {
  const theme = useTheme();
  const styles = useStyles();
  const isDawn = state === 'dawn' && plannedWake != null;
  const isHeld = state === 'held' || state === 'conquered';
  const stateLabel = copy.states[state];

  return (
    <PressableScale
      scaleTo="card"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        isDawn
          ? copy.dawnLabel(plannedWake, activityLabel)
          : copy.accessibleLabel(held, total, stateLabel, activityLabel)
      }
      style={styles.card}
    >
      <Glow color="accent" intensity={GLOW[state]} />
      <View style={styles.top}>
        <Txt variant="label">{runDays != null && runDays > 0 ? copy.runLabel(runDays) : copy.label}</Txt>
        <View style={[styles.pill, isHeld && styles.pillHeld]}>
          <Txt variant="micro" color={isHeld ? 'onAccent' : 'textMuted'}>
            {stateLabel}
          </Txt>
        </View>
      </View>

      <View style={styles.centre}>
        {isDawn ? (
          <RollingNumber value={plannedWake} variant="hero" />
        ) : (
          <View style={styles.count}>
            <RollingNumber value={String(held)} variant="hero" color={isHeld ? 'accent' : 'text'} />
            {total > 0 ? (
              <Txt variant="heading" color="textMuted" style={styles.of}>
                {copy.of(total)}
              </Txt>
            ) : null}
          </View>
        )}
        <Txt variant="caption" style={styles.caption}>
          {isDawn ? copy.dawnCaption : total === 0 ? copy.noOrders : copy.caption(earned)}
        </Txt>
      </View>

      <View style={{ marginHorizontal: -theme.space.xs }}>
        <DayPath
          progress={progress}
          marks={marks}
          spans={spans}
          day={day}
          isLoaded={isActivityLoaded}
          isHeld={isHeld}
        />
      </View>
    </PressableScale>
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
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: {
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xxs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
  pillHeld: { backgroundColor: theme.colors.accent },
  centre: { alignItems: 'center', paddingTop: theme.space.md },
  count: { flexDirection: 'row', alignItems: 'baseline' },
  of: { marginLeft: theme.space.xxs },
  caption: { marginTop: theme.space.xxs },
}));
