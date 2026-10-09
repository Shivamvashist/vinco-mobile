import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import type { WeightPoint } from '@/features/logs';
import { daysBetween } from '@/lib/dates';
import { createStyles, useTheme } from '@/theme';

import { Txt } from '../Txt';

export type WeightChartProps = {
  /** Oldest first. */
  points: readonly WeightPoint[];
  /** "12 October" */
  formatDay: (day: string) => string;
  /** "71.8 to 73.2 kg" */
  formatRange: (low: number, high: number) => string;
  accessibilityLabel: string;
};

const CHART_HEIGHT = 140;
const PADDING = 10;
const DOT_RADIUS = 3;
const LAST_DOT_RADIUS = 5;
/** Keeps a flat line off the edges: at least this many kg between bottom and top. */
const MIN_SPAN_KG = 1;

/**
 * Every weigh-in across the arc as one quiet line: days spaced by date, the latest point
 * larger. Lowest and highest on the right, first and last day underneath. No judgement.
 */
export function WeightChart({ points, formatDay, formatRange, accessibilityLabel }: WeightChartProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(0);

  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return null;

  const values = points.map((point) => point.kg);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const middle = (low + high) / 2;
  const span = Math.max(high - low, MIN_SPAN_KG);
  const bottom = middle - span / 2;
  const totalDays = Math.max(1, daysBetween(first.day, last.day));

  const plotWidth = Math.max(0, width - PADDING * 2);
  const plotHeight = CHART_HEIGHT - PADDING * 2;
  const toX = (day: string) =>
    points.length === 1 ? width / 2 : PADDING + (daysBetween(first.day, day) / totalDays) * plotWidth;
  const toY = (kg: number) => PADDING + (1 - (kg - bottom) / span) * plotHeight;
  const line = points.map((point) => `${toX(point.day)},${toY(point.kg)}`).join(' ');

  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <View style={styles.plot} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            <Line
              x1={PADDING}
              x2={width - PADDING}
              y1={toY(middle)}
              y2={toY(middle)}
              stroke={theme.colors.border}
              strokeDasharray="4 4"
            />
            {points.length > 1 ? (
              <Polyline
                points={line}
                fill="none"
                stroke={theme.colors.accent}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {points.map((point, index) => {
              const isLast = index === points.length - 1;
              return (
                <Circle
                  key={point.day}
                  cx={toX(point.day)}
                  cy={toY(point.kg)}
                  r={isLast ? LAST_DOT_RADIUS : DOT_RADIUS}
                  fill={isLast ? theme.colors.accent : theme.colors.surface}
                  stroke={theme.colors.accent}
                  strokeWidth={1.5}
                />
              );
            })}
          </Svg>
        ) : null}
      </View>
      <View style={styles.footer} importantForAccessibility="no-hide-descendants">
        <Txt variant="micro">{formatDay(first.day)}</Txt>
        <Txt variant="micro">{formatRange(low, high)}</Txt>
        <Txt variant="micro">{formatDay(last.day)}</Txt>
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  plot: { height: CHART_HEIGHT },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.xs },
}));
