import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/Card';
import { type PeriodBar, PeriodBarChart } from '@/components/charts/PeriodBarChart';
import { PeriodNavigator } from '@/components/charts/PeriodNavigator';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Txt } from '@/components/Txt';
import { periodsCopy, reelsCopy } from '@/copy';
import {
  firstReelDay,
  type ReelDay,
  type ReelLogView,
  type ReelRange,
  reelBarValues,
  reelRangeNavigation,
  reelRangeOf,
  reelReferenceValue,
  shiftReelRange,
} from '@/features/guard';
import { parseDayKey, type DayKey } from '@/lib/dates';
import { type ColorRole, createStyles } from '@/theme';

export type ReelLogChartProps = {
  days: readonly ReelDay[];
  passesByDay: ReadonlyMap<DayKey, number>;
  budget: number;
  /** The reel day (the phone's date). */
  today: DayKey;
};

const copy = reelsCopy.log;
const LAYERS: readonly ColorRole[] = ['textMuted', 'danger'];
const SCALE_FLOOR = 10;

/**
 * The log: Day (a bar a day for a week) or Week (a bar a week for eight weeks), each bar split at
 * the budget (muted within it, porphyry past it), the budget as a dashed gold line. Until the user
 * steps back, the view follows today.
 */
export function ReelLogChart({ days, passesByDay, budget, today }: ReelLogChartProps) {
  const styles = useStyles();
  const [view, setView] = useState<ReelLogView>('day');
  // null follows today.
  const [anchor, setAnchor] = useState<DayKey | null>(null);
  const range = reelRangeOf(view, anchor != null && anchor < today ? anchor : today);
  const firstDay = firstReelDay(days);
  const navigation = reelRangeNavigation(range, firstDay, today);
  const values = reelBarValues(range, days, budget, passesByDay);
  const reference = reelReferenceValue(view, budget);

  const bars: PeriodBar[] = range.spans.map((span, index) => {
    const value = values[index] ?? { within: 0, over: 0, total: 0 };
    const name = barName(range, span.start, today);
    const isFuture = span.start > today;
    return {
      key: span.start,
      values: [value.within, value.over],
      axisLabel: axisLabel(range, span.start),
      description: isFuture ? periodsCopy.notYet(name) : copy.barValue(name, value.total, value.over),
      valueLabel: copy.barValue(name, value.total, value.over),
      isFuture,
    };
  });

  const step = (steps: number) => {
    const next = shiftReelRange(range, steps);
    setAnchor(next.end >= today ? null : next.end);
  };

  return (
    <View style={styles.wrap}>
      <SegmentedControl
        options={copy.views}
        value={view}
        onChange={(next) => {
          setView(next);
          setAnchor(null);
        }}
      />
      <PeriodNavigator
        label={periodsCopy.label({ kind: 'week', start: range.start, end: range.end }, today)}
        previousLabel={copy.previous(view)}
        nextLabel={copy.next(view)}
        canGoBack={navigation.canGoBack}
        canGoForward={navigation.canGoForward}
        onPrevious={() => navigation.canGoBack && step(-1)}
        onNext={() => navigation.canGoForward && step(1)}
      />
      <Card>
        <PeriodBarChart
          bars={bars}
          layerColors={LAYERS}
          formatScale={(top) => String(Math.round(top))}
          describeScale={copy.scale}
          periodKey={`${view}:${range.start}`}
          scaleFloor={SCALE_FLOOR}
          hint={periodsCopy.tapHint}
          reference={{
            value: reference,
            label: copy.budgetLine(reference),
            accessibilityLabel: copy.budgetLineLabel(reference),
          }}
        />
        <View style={styles.legend} importantForAccessibility="no-hide-descendants">
          <Swatch color="textMuted" label={copy.legendWithin} />
          <Swatch color="danger" label={copy.legendOver} />
        </View>
        {firstDay == null ? (
          <Txt variant="caption" style={styles.empty}>
            {copy.empty}
          </Txt>
        ) : null}
      </Card>
    </View>
  );
}

function barName(range: ReelRange, start: DayKey, today: DayKey): string {
  if (range.view === 'week') return copy.weekName(start, today);
  return periodsCopy.bucketName('week', { index: 0, start, end: start }, today);
}

/** A weekday initial (Day), or the Monday's date (Week): "27". */
function axisLabel(range: ReelRange, start: DayKey): string {
  if (range.view === 'week') return String(parseDayKey(start).day);
  return periodsCopy.axisLabel('week', { index: 0, start, end: start });
}

function Swatch({ color, label }: { color: ColorRole; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, color === 'danger' ? styles.over : styles.within]} />
      <Txt variant="micro" style={styles.swatchLabel}>
        {label}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.md },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: theme.space.lg,
    rowGap: theme.space.xs,
    marginTop: theme.space.md,
  },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs, flexShrink: 1 },
  swatch: { width: theme.space.sm, height: theme.space.sm, borderRadius: theme.radius.xs },
  swatchLabel: { flexShrink: 1 },
  within: { backgroundColor: theme.colors.textMuted },
  over: { backgroundColor: theme.colors.danger },
  empty: { marginTop: theme.space.md },
}));
