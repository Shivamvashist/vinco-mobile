import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { niceCeiling } from '@/features/periods';
import { type ColorRole, createStyles, themeSpring, useFeedback, useReduceMotion, useTheme } from '@/theme';

import { Txt } from '../Txt';

export type PeriodBar = {
  key: string;
  /** Stacked from the baseline up, one value per layer, in the chart's units. */
  values: readonly number[];
  /** Under the bar ("M", "15", "O"); '' leaves the slot empty (a month thins its labels). */
  axisLabel: string;
  /** What a screen reader says for the bar. */
  description: string;
  /** Shown above the chart when the bar is tapped. */
  valueLabel: string;
  /** A day or month still to come: a faint baseline that can't be tapped. */
  isFuture?: boolean;
};

export type PeriodBarChartProps = {
  bars: readonly PeriodBar[];
  /** One colour role per stacked layer, bottom first. */
  layerColors: readonly ColorRole[];
  /** The scale's top value, short: "2h", "500". */
  formatScale: (value: number) => string;
  /** Changes with the period: the bars grow in again and the tapped bar clears. */
  periodKey: string;
  /** The lowest top the scale can have, so a quiet period doesn't look full. Default 1. */
  scaleFloor?: number;
  /** Shown above the chart until a bar is tapped. */
  hint: string;
  /** Screen-reader label for the scale: "Scale up to 2h". */
  describeScale: (top: string) => string;
  /**
   * Optional dashed line at a value in the chart's units (the reel budget), labelled at its left.
   * The scale stretches to show it.
   */
  reference?: { value: number; label: string; accessibilityLabel: string };
};

/** Height the tallest bar reaches. One-off, sized like Vidi's week charts. */
const BAR_AREA_HEIGHT = 132;
/** Bars grow in one after another, the whole wave within about a quarter second. */
const STAGGER_BUDGET_MS = 240;

/**
 * The history chart shared by the focus log and Gloria: one bar per day (a week or a month) or per
 * month (a year), stacked in layers, on a rounded scale with a dashed top line. Bars spring up
 * when the period changes (at once with Reduce motion); tapping one shows its value above the
 * chart, and a screen reader reads each bar on its own. Bars thin out to fit 31 on a narrow phone.
 */
export function PeriodBarChart({
  bars,
  layerColors,
  formatScale,
  periodKey,
  scaleFloor = 1,
  hint,
  describeScale,
  reference,
}: PeriodBarChartProps) {
  const styles = useStyles();
  const theme = useTheme();
  const play = useFeedback();
  // The tapped bar belongs to one period: a new period starts with none tapped.
  const [tapped, setTapped] = useState<{ periodKey: string; barKey: string } | null>(null);
  const selectedKey = tapped?.periodKey === periodKey ? tapped.barKey : null;
  const selected = bars.find((bar) => bar.key === selectedKey) ?? null;

  const totals = bars.map((bar) => (bar.isFuture ? 0 : sumOf(bar.values)));
  const referenceValue =
    reference && Number.isFinite(reference.value) && reference.value > 0 ? reference.value : 0;
  const top = niceCeiling(Math.max(0, referenceValue, ...totals), scaleFloor);
  const gap = bars.length > 14 ? theme.space.xxs : bars.length > 7 ? theme.space.xs : theme.space.sm;
  const stagger = bars.length > 0 ? Math.min(60, STAGGER_BUDGET_MS / bars.length) : 0;
  const scaleText = formatScale(top);

  return (
    <View>
      <Txt
        variant="caption"
        color={selected ? 'text' : 'textMuted'}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        accessibilityLiveRegion="polite"
        style={styles.readout}
      >
        {selected ? selected.valueLabel : hint}
      </Txt>
      <View style={styles.area}>
        <View style={styles.topLine} pointerEvents="none" accessibilityLabel={describeScale(scaleText)}>
          <Txt variant="micro" color="textFaint" style={styles.scaleLabel}>
            {scaleText}
          </Txt>
        </View>
        <View style={styles.midLine} pointerEvents="none" importantForAccessibility="no" />
        {reference && referenceValue > 0 ? (
          <View
            style={[styles.reference, { bottom: (referenceValue / top) * BAR_AREA_HEIGHT }]}
            pointerEvents="none"
            accessible
            accessibilityLabel={reference.accessibilityLabel}
          >
            <Txt variant="micro" color="accent" numberOfLines={1} style={styles.referenceLabel}>
              {reference.label}
            </Txt>
          </View>
        ) : null}
        <View style={[styles.bars, { gap }]}>
          {bars.map((bar, index) => {
            const isSelected = bar.key === selectedKey;
            return (
              <Pressable
                key={bar.key}
                disabled={bar.isFuture}
                accessibilityRole="button"
                accessibilityLabel={bar.description}
                accessibilityState={{ selected: isSelected, disabled: bar.isFuture === true }}
                onPress={() => {
                  play('select');
                  setTapped(isSelected ? null : { periodKey, barKey: bar.key });
                }}
                style={[styles.column, isSelected && styles.columnSelected]}
              >
                {bar.isFuture || (totals[index] ?? 0) <= 0 ? (
                  <View style={[styles.baseline, bar.isFuture && styles.baselineFuture]} />
                ) : (
                  <Bar
                    key={periodKey}
                    height={(Math.min(totals[index] ?? 0, top) / top) * BAR_AREA_HEIGHT}
                    values={bar.values}
                    layerColors={layerColors}
                    delay={index * stagger}
                    isDimmed={selectedKey != null && !isSelected}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={[styles.labels, { gap }]} importantForAccessibility="no-hide-descendants">
        {bars.map((bar) => (
          <View key={bar.key} style={styles.labelSlot}>
            <Txt variant="micro" align="center" numberOfLines={1} style={styles.label}>
              {bar.axisLabel}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

type BarProps = {
  height: number;
  values: readonly number[];
  layerColors: readonly ColorRole[];
  delay: number;
  isDimmed: boolean;
};

/** One stacked bar, springing from the baseline to its height (and to a new height on new data). */
function Bar({ height, values, layerColors, delay, isDimmed }: BarProps) {
  const styles = useStyles();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const grown = useSharedValue(reduceMotion ? height : 0);
  const hasGrown = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      grown.set(height);
    } else {
      // Only the entrance waits its turn; a later change (a focus settling) springs at once.
      const spring = withSpring(height, themeSpring('settle'));
      grown.set(hasGrown.current ? spring : withDelay(delay, spring));
    }
    hasGrown.current = true;
  }, [grown, height, delay, reduceMotion]);

  const growStyle = useAnimatedStyle(() => ({ height: Math.max(0, grown.get()) }));

  return (
    <Animated.View style={[styles.bar, isDimmed && styles.dimmed, growStyle]}>
      {values.map((value, layer) =>
        value > 0 ? (
          <View
            key={layer}
            style={{
              flex: value,
              backgroundColor: theme.colors[layerColors[layer] ?? 'accent'],
            }}
          />
        ) : null,
      )}
    </Animated.View>
  );
}

function sumOf(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0), 0);
}

const useStyles = createStyles((theme) => ({
  readout: { minHeight: theme.space.xl, marginBottom: theme.space.xs },
  area: { height: BAR_AREA_HEIGHT + theme.space.lg, justifyContent: 'flex-end' },
  topLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BAR_AREA_HEIGHT,
    borderTopWidth: theme.layout.borderWidth,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  scaleLabel: { position: 'absolute', right: 0, bottom: theme.space.xxs },
  midLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BAR_AREA_HEIGHT / 2,
    borderTopWidth: theme.layout.hairline,
    borderColor: theme.colors.border,
  },
  reference: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    borderTopWidth: theme.layout.borderWidth,
    borderStyle: 'dashed',
    borderColor: theme.colors.accent,
  },
  referenceLabel: {
    position: 'absolute',
    left: 0,
    bottom: theme.space.xxs,
    paddingHorizontal: theme.space.xxs,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surface,
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: BAR_AREA_HEIGHT },
  column: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: theme.radius.xs,
  },
  columnSelected: { backgroundColor: theme.colors.surfaceSunk },
  bar: {
    flexDirection: 'column-reverse',
    overflow: 'hidden',
    borderTopLeftRadius: theme.radius.xs,
    borderTopRightRadius: theme.radius.xs,
    borderBottomLeftRadius: theme.space.xxs,
    borderBottomRightRadius: theme.space.xxs,
  },
  dimmed: { opacity: 0.45 },
  baseline: {
    height: theme.layout.borderWidthStrong,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  baselineFuture: { opacity: 0.4 },
  labels: { flexDirection: 'row', marginTop: theme.space.xs },
  labelSlot: { flex: 1, alignItems: 'center' },
  // Wider than a month's thin bar, so "25" fits; only every fifth day has one, so none collide.
  label: { minWidth: theme.space.xxl },
}));
