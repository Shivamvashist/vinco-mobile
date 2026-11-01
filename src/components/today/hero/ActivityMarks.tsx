import { useEffect, useState } from 'react';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Circle, G, Path } from 'react-native-svg';

import { type ActivityFamily, clusterPathPoints, type PathPoint, type PathSpan } from '@/features/dayPath';
import { dotsPath, type PathDot, type Point, pointAlong, stretchPath } from '@/lib/dayPathGeometry';
import { useTabReturn } from '@/hooks/useTabReturn';
import { motion, themeSpring, useReduceMotion, useTheme } from '@/theme';

export type ActivityMarksProps = {
  /** The arc, sampled, and the distance along it at each sample. */
  points: readonly Point[];
  lengths: readonly number[];
  marks: readonly PathPoint[];
  spans: readonly PathSpan[];
  /** The day shown: a new day starts a fresh "already seen" set. */
  day: string;
  /** True once every source is read, so the first marks never pop in as new. */
  isLoaded: boolean;
};

/** The base dot radius, and the gap under which marks merge. */
const MARK = 3;
const MERGE_GAP = MARK * 2 + 1;
/** A merged dot grows a little with its count, at most to this many doublings. */
const MAX_GROWTH_STEPS = 3;
/** The replay: marks pop in time order after the line starts, all within its budget. */
const FIRST_DELAY = motion.duration.instant;
const LAST_DELAY = 420;
const POP_MS = 320;
const REPLAY_MS = LAST_DELAY + POP_MS;
/** Only the newest few marks added since the card mounted keep their own animated dot. */
const MAX_POPPING = 6;
/** A mark that joins an existing dot pops from here, not from nothing. */
const GROW_FROM = 0.6;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Seen = { day: string; ids: ReadonlySet<string> };

/**
 * Today's activity on the day path: a dot where each thing was done (marks too close merge into
 * one slightly larger dot), and a stretch of the line for each focus. Drawn as one path per colour
 * (orders accent, focus info, logs textMuted). A mark added while the card is open pops in on the
 * pop spring; nothing else re-animates. On a return to Today, every dot pops in again in time order.
 */
export function ActivityMarks({ points, lengths, marks, spans, day, isLoaded }: ActivityMarksProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const total = lengths.at(-1) ?? 0;
  const [seen, setSeen] = useState<Seen | null>(null);
  const elapsed = useSharedValue(REPLAY_MS);

  // Remember what was there when the day was first read: only later marks are new.
  if (isLoaded && (seen === null || seen.day !== day)) {
    setSeen({ day, ids: new Set(marks.map((mark) => mark.id)) });
  }
  const known = seen?.day === day ? seen.ids : null;

  useTabReturn(() => {
    setSeen({ day, ids: new Set(marks.map((mark) => mark.id)) });
    if (reduceMotion) return;
    elapsed.set(0);
    elapsed.set(withTiming(REPLAY_MS, { duration: REPLAY_MS, easing: Easing.linear }));
  });

  const clusters = total > 0 ? clusterPathPoints(marks, MERGE_GAP / total) : [];
  const step =
    clusters.length > 1 ? Math.min(motion.stagger, (LAST_DELAY - FIRST_DELAY) / (clusters.length - 1)) : 0;
  const placed = clusters.map((cluster, turn) => {
    const point = pointAlong(points, lengths, cluster.position * total);
    const fresh = known && !reduceMotion ? cluster.ids.filter((id) => !known.has(id)).length : 0;
    const dot: PathDot = {
      x: point.x,
      y: point.y,
      r: markRadius(cluster.count),
      delay: FIRST_DELAY + turn * step,
    };
    return { cluster, dot, fresh };
  });
  const popping = new Set(
    placed
      .filter((item) => item.fresh > 0)
      .slice(-MAX_POPPING)
      .map((item) => item.cluster.key),
  );
  const dotsOf = (family: ActivityFamily) =>
    placed
      .filter((item) => item.cluster.family === family && !popping.has(item.cluster.key))
      .map((item) => item.dot);

  const colors: Record<ActivityFamily, string> = {
    order: theme.colors.accent,
    focus: theme.colors.info,
    log: theme.colors.textMuted,
  };

  return (
    <G>
      {spans.map((span) => (
        <Path
          key={span.id}
          d={stretchPath(points, lengths, span.from * total, span.to * total)}
          stroke={theme.colors.info}
          strokeOpacity={span.style === 'held' ? 0.9 : span.style === 'running' ? 0.6 : 0.45}
          strokeWidth={span.style === 'retreated' ? 3 : 4}
          strokeDasharray={span.style === 'retreated' ? '0.1 5' : undefined}
          strokeLinecap="round"
          fill="none"
        />
      ))}
      <FamilyDots dots={dotsOf('log')} elapsed={elapsed} color={colors.log} />
      <FamilyDots dots={dotsOf('focus')} elapsed={elapsed} color={colors.focus} />
      <FamilyDots dots={dotsOf('order')} elapsed={elapsed} color={colors.order} />
      {placed
        .filter((item) => popping.has(item.cluster.key))
        .map(({ cluster, dot, fresh }) => (
          <PopDot
            key={`${cluster.key}:${cluster.count}`}
            dot={dot}
            from={fresh < cluster.count ? GROW_FROM : 0}
            color={colors[cluster.family]}
          />
        ))}
    </G>
  );
}

type FamilyDotsProps = { dots: readonly PathDot[]; elapsed: SharedValue<number>; color: string };

/** One colour's dots as one path. Re-drawn on the UI thread only while the replay runs. */
function FamilyDots({ dots, elapsed, color }: FamilyDotsProps) {
  const dotsProps = useAnimatedProps(() => ({ d: dotsPath(dots, elapsed.get(), POP_MS) }));
  if (dots.length === 0) return null;
  return <AnimatedPath animatedProps={dotsProps} fill={color} />;
}

type PopDotProps = { dot: PathDot; from: number; color: string };

/** A mark just added: springs in from `from` to full size, once, when it mounts. */
function PopDot({ dot, from, color }: PopDotProps) {
  const scale = useSharedValue(from);

  useEffect(() => {
    scale.set(withSpring(1, themeSpring('pop')));
  }, [scale]);

  const popProps = useAnimatedProps(() => ({ r: dot.r * Math.max(0, scale.get()) }));
  return <AnimatedCircle cx={dot.x} cy={dot.y} animatedProps={popProps} fill={color} />;
}

/** A merged dot is a little larger: a quarter more per doubling of its count, three at most. */
function markRadius(count: number): number {
  return MARK * (1 + 0.25 * Math.min(MAX_GROWTH_STEPS, Math.log2(Math.max(1, count))));
}
