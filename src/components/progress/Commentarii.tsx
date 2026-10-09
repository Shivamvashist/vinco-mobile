import { useState } from 'react';
import { View } from 'react-native';

import { commonCopy, proofCopy, progressCopy } from '@/copy';
import { chartMax, type LogKind, LOG_KINDS, type WeekBar, weekStartOf } from '@/features/logs';
import type { OrderTargets } from '@/features/orders';
import { SLEEP } from '@/features/sleep';
import { useCommentarii } from '@/hooks/useCommentarii';
import { addDays, type DayKey } from '@/lib/dates';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { ChoiceChip } from '../ChoiceChip';
import { IconButton } from '../IconButton';
import { Txt } from '../Txt';
import { WeekBarChart } from './WeekBarChart';
import { WeightChart } from './WeightChart';

export type CommentariiProps = {
  arc: { startDay: DayKey; lengthDays: number };
  targets: OrderTargets;
  today: DayKey;
  /** Today's weight if logged (the button then reads "Update"). */
  todayWeightKg: number | null;
  onLogWeight: () => void;
};

const copy = progressCopy.logs;
const litres = (value: number) => `${Number(value.toFixed(1))}`;

/**
 * The Commentarii (logs): one log at a time, picked with chips. Sleep, water and workout as a
 * week of bars with week-by-week arrows; weight as a line across the arc with the weekly trend.
 */
export function Commentarii({ arc, targets, today, todayWeightKg, onLogWeight }: CommentariiProps) {
  const styles = useStyles();
  const [kind, setKind] = useState<LogKind>('sleep');
  const thisWeek = weekStartOf(today);
  const firstWeek = weekStartOf(arc.startDay);
  const [weekStart, setWeekStart] = useState<DayKey>(thisWeek);
  // Keep the shown week inside the arc so far, even as days roll over.
  const shownWeek = weekStart > thisWeek ? thisWeek : weekStart < firstWeek ? firstWeek : weekStart;
  const logs = useCommentarii(arc, targets, shownWeek, today);

  return (
    <View>
      <Txt variant="eyebrow" style={styles.eyebrow}>
        {copy.eyebrow}
      </Txt>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {LOG_KINDS.map((option) => (
          <ChoiceChip
            key={option}
            label={copy.kinds[option]}
            selected={kind === option}
            onPress={() => setKind(option)}
            cue="toggle"
          />
        ))}
      </View>

      {kind === 'weight' ? (
        <WeightLog today={today} logs={logs} todayWeightKg={todayWeightKg} onLogWeight={onLogWeight} />
      ) : (
        <>
          <View style={styles.weekNav}>
            <IconButton
              icon="back"
              accessibilityLabel={copy.previousWeek}
              color={shownWeek > firstWeek ? 'text' : 'textFaint'}
              cue={shownWeek > firstWeek ? 'toggle' : 'denied'}
              onPress={() => {
                if (shownWeek > firstWeek) setWeekStart(addDays(shownWeek, -7));
              }}
            />
            <Txt variant="label">
              {copy.week(
                commonCopy.dayLabel(shownWeek, today),
                commonCopy.dayLabel(addDays(shownWeek, 6), today),
              )}
            </Txt>
            <IconButton
              icon="forward"
              accessibilityLabel={copy.nextWeek}
              color={shownWeek < thisWeek ? 'text' : 'textFaint'}
              cue={shownWeek < thisWeek ? 'toggle' : 'denied'}
              onPress={() => {
                if (shownWeek < thisWeek) setWeekStart(addDays(shownWeek, 7));
              }}
            />
          </View>
          {logs.isLoaded ? <WeekLog kind={kind} logs={logs} targets={targets} today={today} /> : null}
        </>
      )}
    </View>
  );
}

type WeekLogProps = {
  kind: Exclude<LogKind, 'weight'>;
  logs: ReturnType<typeof useCommentarii>;
  targets: OrderTargets;
  today: DayKey;
};

/** One week of sleep, water or workout: the chart card and the insight under it. */
function WeekLog({ kind, logs, targets, today }: WeekLogProps) {
  const styles = useStyles();
  const { bars, summary } = logs[kind];
  const goal = kind === 'sleep' ? SLEEP.targetMinutes : targets[kind].full;
  const values = bars.map((bar) => bar.value);
  const dayName = (day: DayKey) => commonCopy.dayLabel(day, today);

  const show = (value: number): string =>
    kind === 'sleep'
      ? `${Number((value / 60).toFixed(1))}`
      : kind === 'water'
        ? litres(value)
        : `${Math.round(value)}`;
  const spoken = (value: number): string =>
    kind === 'sleep'
      ? commonCopy.duration(value)
      : kind === 'water'
        ? `${litres(value)} L`
        : `${Math.round(value)} min`;

  const header =
    kind === 'sleep'
      ? { title: copy.sleep.title, target: copy.sleep.target(commonCopy.duration(SLEEP.targetMinutes)) }
      : kind === 'water'
        ? { title: copy.water.title, target: copy.water.target(litres(targets.water.full)) }
        : { title: copy.workout.title, target: copy.workout.target(targets.workout.full) };

  const insight =
    summary.loggedDays === 0 || summary.average == null
      ? copy[kind].empty
      : kind === 'sleep'
        ? copy.sleep.insight(
            commonCopy.duration(summary.average),
            summary.best ? dayName(summary.best.day) : '',
            summary.best ? commonCopy.duration(summary.best.value) : '',
          )
        : kind === 'water'
          ? copy.water.insight(litres(summary.average), summary.daysAtGoal, summary.loggedDays)
          : copy.workout.insight(Math.round(summary.total), summary.daysAtGoal, summary.loggedDays);

  return (
    <>
      <Card variant="sunk" bordered style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Txt variant="label">{header.title}</Txt>
          <Txt variant="caption">{header.target}</Txt>
        </View>
        <View style={styles.chart}>
          <WeekBarChart
            bars={bars}
            max={chartMax(values, goal)}
            target={goal}
            weekdayInitials={copy.weekdayInitials}
            formatValue={show}
            describeBar={(bar: WeekBar) =>
              copy.barLabel(dayName(bar.day), bar.value != null ? spoken(bar.value) : null)
            }
          />
        </View>
      </Card>
      <Card style={styles.insight}>
        <Txt variant="body">{insight}</Txt>
      </Card>
    </>
  );
}

type WeightLogProps = {
  today: DayKey;
  logs: ReturnType<typeof useCommentarii>;
  todayWeightKg: number | null;
  onLogWeight: () => void;
};

/** Body weight: the weekly trend in words, the line across the arc, and the log button. */
function WeightLog({ today, logs, todayWeightKg, onLogWeight }: WeightLogProps) {
  const styles = useStyles();
  const weight = copy.weight;
  const { thisWeek, change } = logs.weightTrend;
  const hasAny = logs.weights.length > 0;

  return (
    <>
      <Card variant="sunk" bordered style={styles.chartCard}>
        <Txt variant="label">{weight.title}</Txt>
        {hasAny ? (
          <>
            <Txt variant="heading" style={styles.headline}>
              {thisWeek != null ? weight.thisWeek(proofCopy.kg(thisWeek)) : weight.noneThisWeek}
            </Txt>
            <Txt variant="caption">
              {change != null ? weight.change(change) : thisWeek != null ? weight.firstWeek : ''}
            </Txt>
            <View style={styles.chart}>
              <WeightChart
                points={logs.weights}
                formatDay={(day) => commonCopy.dayLabel(day, today)}
                formatRange={(low, high) => weight.range(proofCopy.kg(low), proofCopy.kg(high))}
                accessibilityLabel={weight.chartLabel(logs.weights.length)}
              />
            </View>
          </>
        ) : (
          <Txt variant="body" color="textMuted" style={styles.headline}>
            {weight.empty}
          </Txt>
        )}
      </Card>
      <View style={styles.insight}>
        <Button
          label={todayWeightKg != null ? weight.updateToday : weight.logToday}
          variant={todayWeightKg != null ? 'secondary' : 'primary'}
          onPress={onLogWeight}
        />
      </View>
    </>
  );
}

const useStyles = createStyles((theme) => ({
  eyebrow: { marginBottom: theme.space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space.md,
  },
  chartCard: { marginTop: theme.space.sm },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chart: { marginTop: theme.space.md },
  headline: { marginTop: theme.space.sm },
  insight: { marginTop: theme.space.md },
}));
