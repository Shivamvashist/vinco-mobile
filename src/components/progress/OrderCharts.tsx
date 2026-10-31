import { View } from 'react-native';

import { commonCopy, progressCopy } from '@/copy';
import { chartMax, type WeekBar } from '@/features/logs';
import { type OrderChart, useOrderCharts } from '@/hooks/useOrderCharts';
import type { DayKey } from '@/lib/dates';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

import { Card } from '../Card';
import { ChoiceChip } from '../ChoiceChip';
import { Icon } from '../Icon';
import { Txt } from '../Txt';
import { WeekBarChart } from './WeekBarChart';

const copy = progressCopy.logs;

export type OrderChartsProps = {
  arc: { id: number; startDay: DayKey; lengthDays: number };
  weekStart: DayKey;
  today: DayKey;
};

/**
 * The Orders log: a chip for each of the user's own orders to show or hide its chart (saved), then
 * one week per shown order. Counted orders are bars against their goal; done-or-not orders are a
 * row of ticks. Vinco's orders have their own logs (sleep, water, workout), so they get no chart here.
 */
export function OrderCharts({ arc, weekStart, today }: OrderChartsProps) {
  const styles = useStyles();
  const hidden = usePreferencesStore((state) => state.hiddenOrderCharts);
  const toggle = usePreferencesStore((state) => state.toggleOrderChart);
  const { charts, isLoaded } = useOrderCharts(arc, weekStart, today);
  if (!isLoaded) return null;
  if (charts.length === 0) {
    return (
      <Card style={styles.card}>
        <Txt variant="body">{copy.orders.empty}</Txt>
      </Card>
    );
  }
  const shown = charts.filter((chart) => !hidden.includes(chart.key));

  return (
    <View>
      <View style={styles.chips} accessibilityLabel={copy.orders.chipsHint}>
        {charts.map((chart) => (
          <ChoiceChip
            key={chart.key}
            label={chart.name}
            selected={!hidden.includes(chart.key)}
            onPress={() => toggle(chart.key)}
            isMulti
          />
        ))}
      </View>
      {shown.length === 0 ? (
        <Txt variant="caption" style={styles.card}>
          {copy.orders.allHidden}
        </Txt>
      ) : (
        shown.map((chart) => <OrderWeek key={chart.key} chart={chart} today={today} />)
      )}
    </View>
  );
}

/** An amount in the order's own words: "12 pages", or the number alone without a unit. */
function formatAmount(chart: OrderChart, value: number): string {
  const rounded = Number(value.toFixed(1));
  return chart.unit ? `${rounded} ${chart.unit}` : `${rounded}`;
}

type OrderWeekProps = { chart: OrderChart; today: DayKey };

/** One order's week: title and goal, then bars or ticks, then one line of how it went. */
function OrderWeek({ chart, today }: OrderWeekProps) {
  const styles = useStyles();
  const dayName = (day: DayKey) => commonCopy.dayLabel(day, today);
  const logged = chart.bars.filter((bar) => bar.value != null);
  const atGoal = logged.filter((bar) => bar.tone === 'full').length;

  return (
    <Card variant="sunk" bordered style={styles.card}>
      <View style={styles.header}>
        <Txt variant="label" numberOfLines={1} style={styles.title}>
          {chart.name}
        </Txt>
        <Txt variant="caption">
          {chart.isCheck ? copy.orders.everyDay : copy.orders.goal(formatAmount(chart, chart.target.full))}
        </Txt>
      </View>
      <View style={styles.chart}>
        {chart.isCheck ? (
          <TickWeek bars={chart.bars} dayName={dayName} />
        ) : (
          <WeekBarChart
            bars={chart.bars}
            max={chartMax(
              chart.bars.map((bar) => bar.value),
              chart.target.full,
            )}
            target={chart.target.full}
            weekdayInitials={copy.weekdayInitials}
            formatValue={(value) => `${Number(value.toFixed(1))}`}
            describeBar={(bar: WeekBar) =>
              copy.barLabel(dayName(bar.day), bar.value != null ? formatAmount(chart, bar.value) : null)
            }
          />
        )}
      </View>
      {logged.length > 0 ? (
        <Txt variant="caption" style={styles.summary}>
          {chart.isCheck
            ? copy.orders.doneDays(atGoal, logged.length)
            : copy.orders.atGoal(atGoal, logged.length)}
        </Txt>
      ) : null}
    </Card>
  );
}

type TickWeekProps = { bars: readonly WeekBar[]; dayName: (day: DayKey) => string };

/** Seven circles, Monday first: filled and ticked when done, open when not, faint when not counted. */
function TickWeek({ bars, dayName }: TickWeekProps) {
  const styles = useStyles();
  return (
    <View style={styles.ticks}>
      {bars.map((bar, index) => {
        const isCounted = bar.value != null;
        const isDone = bar.tone === 'full';
        return (
          <View
            key={bar.day}
            style={styles.tickDay}
            accessible
            accessibilityLabel={copy.orders.tickLabel(dayName(bar.day), isCounted ? isDone : null)}
          >
            <View
              style={[styles.tick, isDone ? styles.tickDone : isCounted ? styles.tickOpen : styles.tickEmpty]}
            >
              {isDone ? <Icon name="check" size={14} color="onAccent" strokeWidth={3} /> : null}
            </View>
            <Txt variant="micro">{copy.weekdayInitials[index]}</Txt>
          </View>
        );
      })}
    </View>
  );
}

const TICK_SIZE = 28;

const useStyles = createStyles((theme) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.md },
  card: { marginTop: theme.space.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: theme.space.sm,
  },
  title: { flexShrink: 1 },
  chart: { marginTop: theme.space.md },
  summary: { marginTop: theme.space.sm },
  ticks: { flexDirection: 'row', justifyContent: 'space-between' },
  tickDay: { alignItems: 'center', gap: theme.space.xs },
  tick: {
    width: TICK_SIZE,
    height: TICK_SIZE,
    borderRadius: TICK_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.layout.borderWidthStrong,
  },
  tickDone: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  tickOpen: { borderColor: theme.colors.borderStrong },
  tickEmpty: { borderColor: theme.colors.border, opacity: 0.5 },
}));
