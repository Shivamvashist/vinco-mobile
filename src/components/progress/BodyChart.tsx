import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Polyline } from 'react-native-svg';

import { daysBetween, type DayKey } from '@/lib/dates';
import { type ColorRole, createStyles, useTheme } from '@/theme';

import { Txt } from '../Txt';

export type BodySeries = {
  key: string;
  /** Oldest first. */
  points: readonly { day: DayKey; value: number }[];
  color: ColorRole;
  /** "71.8 to 73.2 kg" under the chart. */
  rangeLabel: string;
  /** Dashed, for the second line, so the two read apart without colour. */
  isDashed?: boolean;
};

export type BodyChartProps = {
  /** Shown lines (hidden ones are left out by the caller). */
  series: readonly BodySeries[];
  /** "12 October" */
  formatDay: (day: DayKey) => string;
  accessibilityLabel: string;
};

const CHART_HEIGHT = 150;
const PADDING = 10;
const DOT_RADIUS = 3;
const LAST_DOT_RADIUS = 5;

/**
 * Weight and calories as quiet lines on one shared date axis, each on its own scale (so 72 kg and
 * 1,800 kcal both fill the height). The latest point of each is larger. No judgement, no targets.
 */
export function BodyChart({ series, formatDay, accessibilityLabel }: BodyChartProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(0);

  const days = series.flatMap((line) => line.points.map((point) => point.day)).sort();
  const first = days[0];
  const last = days.at(-1);
  if (!first || !last) return null;

  const totalDays = Math.max(1, daysBetween(first, last));
  const plotWidth = Math.max(0, width - PADDING * 2);
  const plotHeight = CHART_HEIGHT - PADDING * 2;
  const toX = (day: DayKey) =>
    first === last ? width / 2 : PADDING + (daysBetween(first, day) / totalDays) * plotWidth;

  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <View style={styles.plot} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            <Line
              x1={PADDING}
              x2={width - PADDING}
              y1={CHART_HEIGHT / 2}
              y2={CHART_HEIGHT / 2}
              stroke={theme.colors.border}
              strokeDasharray="4 4"
            />
            {series.map((line) => {
              const values = line.points.map((point) => point.value);
              const low = Math.min(...values);
              const high = Math.max(...values);
              // A flat line sits in the middle rather than on an edge.
              const span = high - low || Math.max(1, Math.abs(high) * 0.02);
              const bottom = high === low ? low - span / 2 : low;
              const toY = (value: number) => PADDING + (1 - (value - bottom) / span) * plotHeight;
              const color = theme.colors[line.color];
              return (
                <G key={line.key}>
                  {line.points.length > 1 ? (
                    <Polyline
                      points={line.points.map((point) => `${toX(point.day)},${toY(point.value)}`).join(' ')}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray={line.isDashed ? '6 4' : undefined}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ) : null}
                  {line.points.map((point, index) => {
                    const isLast = index === line.points.length - 1;
                    return (
                      <Circle
                        key={point.day}
                        cx={toX(point.day)}
                        cy={toY(point.value)}
                        r={isLast ? LAST_DOT_RADIUS : DOT_RADIUS}
                        fill={isLast ? color : theme.colors.surface}
                        stroke={color}
                        strokeWidth={1.5}
                      />
                    );
                  })}
                </G>
              );
            })}
          </Svg>
        ) : null}
      </View>
      <View style={styles.footer} importantForAccessibility="no-hide-descendants">
        <Txt variant="micro">{formatDay(first)}</Txt>
        <Txt variant="micro">{formatDay(last)}</Txt>
      </View>
      <View style={styles.legend} importantForAccessibility="no-hide-descendants">
        {series.map((line) => (
          <View key={line.key} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: theme.colors[line.color] }]} />
            <Txt variant="micro">{line.rangeLabel}</Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  plot: { height: CHART_HEIGHT },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.xs },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, marginTop: theme.space.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs },
  swatch: { width: theme.space.md, height: theme.layout.barHeightThin, borderRadius: theme.radius.xs },
}));
