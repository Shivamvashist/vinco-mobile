import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import type { PathPoint, PathSpan, SkyBody } from '@/features/dayPath';
import { cumulativeLengths, PATH_HEIGHT, pointAlong, sampleArc } from '@/lib/dayPathGeometry';
import { useTabReturn } from '@/hooks/useTabReturn';
import { themeTiming, useReduceMotion, useTheme } from '@/theme';

import { ActivityMarks } from './ActivityMarks';
import { SkyGlyph } from './SkyGlyph';

export type DayPathProps = {
  /** Where now sits on the day, 0 (the day's start) to 1 (midnight). */
  progress: number;
  /** Each activity of the day, on the same scale (features/dayPath). */
  marks: readonly PathPoint[];
  /** Each focus of the day, as a stretch on the same scale. */
  spans: readonly PathSpan[];
  /** The day shown, so marks from a new day are not taken for new marks. */
  day: string;
  /** True once the day's activity has been read. */
  isLoaded: boolean;
  /** Brighter once the day holds. */
  isHeld: boolean;
  /** The sky view's share, 0 (the now dot) to 1 (the sun or moon rides at now instead). */
  sky: SharedValue<number>;
  body: SkyBody;
};

const DOT = 6;
/** The sun or moon, across. Fits the path's height at its ends and its peak. */
const GLYPH = 18;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * The day as the sun's path: a dotted arc from the day's start (left) to midnight (right), solid
 * up to now, with a glowing dot at now and a mark where each thing was done (ActivityMarks). Time
 * running out is seen, not read. Decorative: the card around it says the numbers.
 *
 * In the sky view (the hero's second face) the dot fades and the sun or moon rides at now instead.
 *
 * Each time the user comes back to Today, the line draws again from the start to now (the dot
 * rides along) and the marks pop in, in time order. Not on first open; never with reduce motion on.
 */
export function DayPath({ progress, marks, spans, day, isLoaded, isHeld, sky, body }: DayPathProps) {
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
    return { cx: point.x, cy: point.y, opacity: 1 - sky.get() };
  });
  const glyphStyle = useAnimatedStyle(() => {
    const point = pointAlong(points, lengths, drawn.get());
    return {
      opacity: sky.get(),
      transform: [{ translateX: point.x - GLYPH / 2 }, { translateY: point.y - GLYPH / 2 }],
    };
  });

  return (
    <View
      style={{ height: PATH_HEIGHT }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {width > 0 ? (
        <Svg width={width} height={PATH_HEIGHT}>
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
          <ActivityMarks
            points={points}
            lengths={lengths}
            marks={marks}
            spans={spans}
            day={day}
            isLoaded={isLoaded}
          />
          <AnimatedCircle
            animatedProps={nowProps}
            r={DOT * 2.2}
            fill={theme.colors.accent}
            fillOpacity={0.18}
          />
          <AnimatedCircle animatedProps={nowProps} r={DOT} fill={theme.colors.text} />
        </Svg>
      ) : null}
      {width > 0 ? (
        <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, glyphStyle]} pointerEvents="none">
          <SkyGlyph body={body} size={GLYPH} />
        </Animated.View>
      ) : null}
    </View>
  );
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
