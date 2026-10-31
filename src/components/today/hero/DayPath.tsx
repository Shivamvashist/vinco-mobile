import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTabReturn } from '@/hooks/useTabReturn';
import { motion, themeSpring, themeTiming, useReduceMotion, useTheme } from '@/theme';

export type DayPathProps = {
  /** Where now sits on the day, 0 (wake-up) to 1 (midnight). */
  progress: number;
  /** Where each order was done, 0 to 1 on the same scale. */
  marks: readonly number[];
  /** Brighter once the day holds. */
  isHeld: boolean;
};

const HEIGHT = 58;
const PAD = 10;
const SAMPLES = 48;
const DOT = 6;
const NOTCH = 3;
/** The notches pop in after the line has started, and all within the replay's budget. */
const NOTCH_FIRST_DELAY = motion.duration.instant;
const NOTCH_LAST_DELAY = 420;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Point = { x: number; y: number };

/**
 * The day as the sun's path: a dotted arc from wake-up (left) to midnight (right), solid up to now,
 * with a glowing dot at now and a notch where each order was done. Time running out is seen, not read.
 * Decorative: the card around it says the numbers.
 *
 * Each time the user comes back to Today, the line draws again from wake-up to now (the dot rides
 * along) and the notches pop in, in the order the orders were done. Not on first open; never with
 * reduce motion on.
 */
export function DayPath({ progress, marks, isHeld }: DayPathProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const clamped = clamp01(progress);
  const points = width > 0 ? sampleArc(width) : [];
  const lengths = cumulativeLengths(points);
  const total = lengths.at(-1) ?? 0;
  const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const target = clamped * total;
  const drawn = useSharedValue(target);
  const notchOrder = orderOf(marks);

  // Keep in step with the clock (and the first layout) without motion.
  useEffect(() => {
    drawn.set(target);
  }, [drawn, target]);

  useTabReturn(() => {
    if (reduceMotion || target <= 0) return;
    drawn.set(0);
    drawn.set(withTiming(target, themeTiming('slow')));
  });

  // The gap is longer than the path, so a fully hidden line never shows a stray round cap.
  const solidProps = useAnimatedProps(() => ({ strokeDashoffset: total - drawn.get() }));
  const nowProps = useAnimatedProps(() => {
    const point = pointAlong(points, lengths, drawn.get());
    return { cx: point.x, cy: point.y };
  });

  return (
    <View
      style={{ height: HEIGHT }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          <Path
            d={pathData}
            stroke={theme.colors.textFaint}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="0.1 7"
            fill="none"
          />
          <AnimatedPath
            d={pathData}
            stroke={theme.colors.accent}
            strokeOpacity={isHeld ? 0.9 : 0.55}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={`${total} ${total + 1}`}
            animatedProps={solidProps}
            fill="none"
          />
          {marks.map((mark, index) => {
            const point = pointAlong(points, lengths, clamp01(mark) * total);
            return (
              <Notch
                key={index}
                x={point.x}
                y={point.y}
                order={notchOrder[index] ?? 0}
                count={marks.length}
                color={theme.colors.accent}
              />
            );
          })}
          <AnimatedCircle
            animatedProps={nowProps}
            r={DOT * 2.2}
            fill={theme.colors.accent}
            fillOpacity={0.18}
          />
          <AnimatedCircle animatedProps={nowProps} r={DOT} fill={theme.colors.text} />
        </Svg>
      ) : null}
    </View>
  );
}

type NotchProps = { x: number; y: number; order: number; count: number; color: string };

/** One order's notch on the path. On a return it pops in at its turn, on the pop spring. */
function Notch({ x, y, order, count, color }: NotchProps) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  useTabReturn(() => {
    if (reduceMotion) return;
    const step =
      count > 1 ? Math.min(motion.stagger, (NOTCH_LAST_DELAY - NOTCH_FIRST_DELAY) / (count - 1)) : 0;
    scale.set(0);
    scale.set(withDelay(NOTCH_FIRST_DELAY + order * step, withSpring(1, themeSpring('pop'))));
  });

  const notchProps = useAnimatedProps(() => ({ r: NOTCH * Math.max(0, scale.get()) }));

  return <AnimatedCircle cx={x} cy={y} animatedProps={notchProps} fill={color} />;
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/** Each mark's turn in time order: the earliest order done pops first. */
function orderOf(marks: readonly number[]): number[] {
  const turns = Array.from({ length: marks.length }, () => 0);
  marks
    .map((mark, index) => ({ mark: clamp01(mark), index }))
    .sort((a, b) => a.mark - b.mark)
    .forEach(({ index }, turn) => {
      turns[index] = turn;
    });
  return turns;
}

/** Points along a quadratic arc that rises in the middle, like the sun's path. */
function sampleArc(width: number): Point[] {
  const start = { x: PAD, y: HEIGHT - PAD };
  const control = { x: width / 2, y: -HEIGHT * 0.35 };
  const end = { x: width - PAD, y: HEIGHT - PAD };
  return Array.from({ length: SAMPLES + 1 }, (_, index) => {
    const t = index / SAMPLES;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    return { x: a * start.x + b * control.x + c * end.x, y: a * start.y + b * control.y + c * end.y };
  });
}

function cumulativeLengths(points: readonly Point[]): number[] {
  const lengths: number[] = [];
  let total = 0;
  points.forEach((point, index) => {
    const previous = points[index - 1];
    if (previous) total += Math.hypot(point.x - previous.x, point.y - previous.y);
    lengths.push(total);
  });
  return lengths;
}

/**
 * The point at a distance along the path, between samples, so the dot and the solid line agree
 * and the dot glides while the line draws. Runs on the UI thread too.
 */
function pointAlong(points: readonly Point[], lengths: readonly number[], distance: number): Point {
  'worklet';
  const fallback = { x: PAD, y: HEIGHT - PAD };
  let index = 0;
  while (index < lengths.length - 1 && (lengths[index] ?? 0) < distance) index += 1;
  const point = points[index];
  const previous = points[index - 1];
  const end = lengths[index];
  const start = lengths[index - 1];
  if (!point) return fallback;
  if (!previous || end == null || start == null || end <= start) return point;
  const share = Math.min(1, Math.max(0, (distance - start) / (end - start)));
  return { x: previous.x + (point.x - previous.x) * share, y: previous.y + (point.y - previous.y) * share };
}
