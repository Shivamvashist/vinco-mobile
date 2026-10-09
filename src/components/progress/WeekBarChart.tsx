import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import type { BarTone, WeekBar } from '@/features/logs';
import { createStyles, themeTiming, useReduceMotion } from '@/theme';

import { Txt } from '../Txt';

export type WeekBarChartProps = {
  bars: readonly WeekBar[];
  /** The value at the top of the chart (see chartMax). */
  max: number;
  /** Where the dashed target line sits, in the bars' units. */
  target: number;
  /** "M T W T F S S", Monday first. */
  weekdayInitials: readonly string[];
  /** The short value over a bar: "7.5", "4". */
  formatValue: (value: number) => string;
  /** What a screen reader says for each bar. */
  describeBar: (bar: WeekBar) => string;
};

/** Height the tallest bar can reach; the value label sits above it. One-off, from the prototype. */
const BAR_AREA_HEIGHT = 120;
const STAGGER_MS = 60;

/**
 * A week of bars, Monday to Sunday, after the prototype's Vidi charts: the value over each bar,
 * a dashed target line, day initials underneath. Bars grow in, one after another.
 */
export function WeekBarChart({
  bars,
  max,
  target,
  weekdayInitials,
  formatValue,
  describeBar,
}: WeekBarChartProps) {
  const styles = useStyles();
  const safeMax = max > 0 ? max : 1;
  const targetOffset = Math.min(1, Math.max(0, target / safeMax)) * BAR_AREA_HEIGHT;

  return (
    <View>
      <View style={styles.area}>
        <View
          pointerEvents="none"
          style={[styles.targetLine, { bottom: targetOffset }]}
          importantForAccessibility="no"
        />
        {bars.map((bar, index) => (
          <View key={bar.day} style={styles.column} accessible accessibilityLabel={describeBar(bar)}>
            <Txt variant="micro" style={styles.value}>
              {bar.value != null ? formatValue(bar.value) : ''}
            </Txt>
            <Bar
              height={bar.value != null ? (Math.min(bar.value, safeMax) / safeMax) * BAR_AREA_HEIGHT : 0}
              tone={bar.tone}
              delay={index * STAGGER_MS}
            />
          </View>
        ))}
      </View>
      <View style={styles.labels} importantForAccessibility="no-hide-descendants">
        {weekdayInitials.map((initial, index) => (
          <Txt key={`${index}-${initial}`} variant="micro" align="center" style={styles.label}>
            {initial}
          </Txt>
        ))}
      </View>
    </View>
  );
}

type BarProps = { height: number; tone: BarTone; delay: number };

/** One bar, growing from the baseline to its height. */
function Bar({ height, tone, delay }: BarProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const grown = useSharedValue(reduceMotion ? height : 0);

  useEffect(() => {
    grown.value = reduceMotion
      ? height
      : withDelay(delay, withTiming(height, themeTiming('slow', 'entrance')));
  }, [grown, height, delay, reduceMotion]);

  const growStyle = useAnimatedStyle(() => ({ height: grown.value }));

  if (tone === 'empty') return <View style={styles.baseline} />;
  return <Animated.View style={[styles.bar, styles[tone], growStyle]} />;
}

const useStyles = createStyles((theme) => ({
  area: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.space.sm,
    height: BAR_AREA_HEIGHT + theme.space.xl,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: theme.layout.borderWidth,
    borderStyle: 'dashed',
    borderColor: theme.colors.textFaint,
  },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: theme.space.xs },
  value: { minHeight: theme.space.md },
  bar: {
    alignSelf: 'stretch',
    borderTopLeftRadius: theme.radius.xs,
    borderTopRightRadius: theme.radius.xs,
    borderBottomLeftRadius: theme.space.xxs,
    borderBottomRightRadius: theme.space.xxs,
  },
  full: { backgroundColor: theme.colors.accent },
  held: {
    backgroundColor: theme.colors.accentFill,
    borderWidth: theme.layout.borderWidthStrong,
    borderColor: theme.colors.accent,
  },
  short: { backgroundColor: theme.colors.danger },
  rest: { backgroundColor: theme.colors.info },
  baseline: {
    alignSelf: 'stretch',
    height: theme.layout.borderWidthStrong,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  labels: { flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.xs },
  label: { flex: 1 },
}));
