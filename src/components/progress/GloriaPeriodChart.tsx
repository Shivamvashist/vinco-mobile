import { View } from 'react-native';

import { periodsCopy, pickTone, rewardsCopy } from '@/copy';
import { gloriaPeriod } from '@/features/gloria';
import { type Period, periodBuckets, shouldLabelBucket } from '@/features/periods';
import type { Tone } from '@/features/tone';
import type { DayKey } from '@/lib/dates';
import { type ColorRole, createStyles } from '@/theme';

import { Card } from '../Card';
import { type PeriodBar, PeriodBarChart } from '../charts/PeriodBarChart';
import { Txt } from '../Txt';

export type GloriaPeriodChartProps = {
  /** A week, month or year (the day view is GloriaDayBreakdown). */
  period: Period;
  byDay: ReadonlyMap<DayKey, number>;
  /** "27 Oct to 2 Nov", "October 2026". */
  periodLabel: string;
  today: DayKey;
  tone: Tone;
};

const copy = rewardsCopy.gloriaHistory;
const LAYERS: readonly ColorRole[] = ['accent'];
/** A quiet period keeps a modest scale: a conquered day is worth about 80. */
const SCALE_FLOOR = { day: 50, month: 500 } as const;

/** A period's Gloria: its total, a bar per day (or month), and its best bar. */
export function GloriaPeriodChart({ period, byDay, periodLabel, today, tone }: GloriaPeriodChartProps) {
  const styles = useStyles();
  const { bars, total } = gloriaPeriod(byDay, period);
  const buckets = periodBuckets(period);
  const bestValue = Math.max(0, ...bars);
  const bestIndex = bestValue > 0 ? bars.indexOf(bestValue) : -1;
  const best = buckets[bestIndex];

  const chartBars: PeriodBar[] = buckets.map((bucket) => {
    const value = bars[bucket.index] ?? 0;
    const name = periodsCopy.bucketName(period.kind, bucket, today);
    const isFuture = bucket.start > today;
    return {
      key: bucket.start,
      values: [value],
      axisLabel: shouldLabelBucket(period.kind, bucket) ? periodsCopy.axisLabel(period.kind, bucket) : '',
      description: isFuture ? periodsCopy.notYet(name) : copy.describeBar(name, value),
      valueLabel: copy.barValue(name, value),
      isFuture,
    };
  });

  return (
    <Card>
      <View style={styles.header}>
        <View accessible accessibilityLabel={copy.periodTotalLabel(total, periodLabel)}>
          <Txt
            variant="display"
            color="accent"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {copy.periodTotal(total)}
          </Txt>
          <Txt variant="micro">{periodLabel}</Txt>
        </View>
        {best ? (
          <Txt variant="micro" align="right" style={styles.best}>
            {copy.bestBar(periodsCopy.bucketName(period.kind, best, today), bestValue)}
          </Txt>
        ) : null}
      </View>
      <View style={styles.chart}>
        <PeriodBarChart
          bars={chartBars}
          layerColors={LAYERS}
          formatScale={copy.periodTotal}
          describeScale={periodsCopy.scaleLabel}
          periodKey={`${period.kind}:${period.start}`}
          scaleFloor={period.kind === 'year' ? SCALE_FLOOR.month : SCALE_FLOOR.day}
          hint={periodsCopy.tapHint}
        />
      </View>
      {total === 0 ? (
        <Txt variant="body" color="textMuted" style={styles.empty}>
          {pickTone(copy.empty, tone)}
        </Txt>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
  best: { flexShrink: 1 },
  chart: { marginTop: theme.space.md },
  empty: { marginTop: theme.space.md },
}));
