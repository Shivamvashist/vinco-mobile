import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme';

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

type Point = { x: number; y: number };

/**
 * The day as the sun's path: a dotted arc from wake-up (left) to midnight (right), solid up to now,
 * with a glowing dot at now and a notch where each order was done. Time running out is seen, not read.
 * Decorative: the card around it says the numbers.
 */
export function DayPath({ progress, marks, isHeld }: DayPathProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const clamped = clamp01(progress);
  const points = width > 0 ? sampleArc(width) : [];
  const lengths = cumulativeLengths(points);
  const total = lengths.at(-1) ?? 0;
  const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const now = pointAt(points, lengths, clamped * total);

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
          <Path
            d={pathData}
            stroke={theme.colors.accent}
            strokeOpacity={isHeld ? 0.9 : 0.55}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={`${clamped * total} ${total}`}
            fill="none"
          />
          {marks.map((mark, index) => {
            const point = pointAt(points, lengths, clamp01(mark) * total);
            return <Circle key={index} cx={point.x} cy={point.y} r={3} fill={theme.colors.accent} />;
          })}
          <Circle cx={now.x} cy={now.y} r={DOT * 2.2} fill={theme.colors.accent} fillOpacity={0.18} />
          <Circle cx={now.x} cy={now.y} r={DOT} fill={theme.colors.text} />
        </Svg>
      ) : null}
    </View>
  );
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
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

/** The point at a distance along the path, so the dot and the solid line agree. */
function pointAt(points: readonly Point[], lengths: readonly number[], distance: number): Point {
  const index = lengths.findIndex((length) => length >= distance);
  const point = points[index < 0 ? points.length - 1 : index];
  return point ?? { x: PAD, y: HEIGHT - PAD };
}
