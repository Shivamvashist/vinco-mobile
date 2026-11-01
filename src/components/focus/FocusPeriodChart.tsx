import { View } from 'react-native';

import { Card } from '@/components/Card';
import { type PeriodBar, PeriodBarChart } from '@/components/charts/PeriodBarChart';
import { Txt } from '@/components/Txt';
import { focusCopy, periodsCopy } from '@/copy';
import type { FocusPeriodBars } from '@/features/focus';
import { type Period, periodBuckets, shouldLabelBucket } from '@/features/periods';
import type { DayKey } from '@/lib/dates';
import { type ColorRole, createStyles } from '@/theme';

export type FocusPeriodChartProps = {
  period: Period;
  bars: FocusPeriodBars;
  today: DayKey;
};

const copy = focusCopy.history;
const LAYERS: readonly ColorRole[] = ['accent', 'textFaint'];
/** The scale never tops out below an hour a day, or ten hours a month, so a quiet period reads quiet. */
const SCALE_FLOOR = { day: 60, month: 600 } as const;

/** Minutes of focus per day (or month), held in gold with retreated time stacked above, muted. */
export function FocusPeriodChart({ period, bars, today }: FocusPeriodChartProps) {
  const styles = useStyles();
  const chartBars: PeriodBar[] = periodBuckets(period).map((bucket) => {
    const held = bars.held[bucket.index] ?? 0;
    const retreated = bars.retreated[bucket.index] ?? 0;
    const name = periodsCopy.bucketName(period.kind, bucket, today);
    const isFuture = bucket.start > today;
    return {
      key: bucket.start,
      values: [held, retreated],
      axisLabel: shouldLabelBucket(period.kind, bucket) ? periodsCopy.axisLabel(period.kind, bucket) : '',
      description: isFuture ? periodsCopy.notYet(name) : copy.describeBar(name, held, retreated),
      valueLabel: copy.barValue(name, held, retreated),
      isFuture,
    };
  });

  return (
    <Card>
      <PeriodBarChart
        bars={chartBars}
        layerColors={LAYERS}
        formatScale={focusCopy.shortDuration}
        describeScale={periodsCopy.scaleLabel}
        periodKey={`${period.kind}:${period.start}`}
        scaleFloor={period.kind === 'year' ? SCALE_FLOOR.month : SCALE_FLOOR.day}
        hint={periodsCopy.tapHint}
      />
      <View style={styles.legend} importantForAccessibility="no-hide-descendants">
        <Swatch color="accent" label={copy.legendHeld} />
        <Swatch color="textFaint" label={copy.legendRetreated} />
      </View>
    </Card>
  );
}

function Swatch({ color, label }: { color: ColorRole; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, styles[color === 'accent' ? 'held' : 'retreated']]} />
      <Txt variant="micro" style={styles.swatchLabel}>
        {label}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
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
  held: { backgroundColor: theme.colors.accent },
  retreated: { backgroundColor: theme.colors.textFaint },
}));
