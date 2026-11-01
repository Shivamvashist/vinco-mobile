import { Pressable, View } from 'react-native';

import { commonCopy, progressCopy, rewardsCopy } from '@/copy';
import { chartMax, type WeekBar } from '@/features/logs';
import { type DayKey, weekdayIndex } from '@/lib/dates';
import { createStyles, useFeedback, useTheme } from '@/theme';

import { Card } from '../Card';
import { Icon } from '../Icon';
import { RollingNumber } from '../RollingNumber';
import { Txt } from '../Txt';

import { WeekBarChart } from './WeekBarChart';

export type GloriaCardProps = {
  total: number;
  /** Monday to Sunday. */
  thisWeek: readonly { day: DayKey; gloria: number }[];
  /** What a conquered day is worth with today's orders: the dashed line. */
  conqueredDay: number;
  today: DayKey;
  /** Opens the Gloria history (/gloria): any day, week, month or year. */
  onOpenHistory?: () => void;
};

const copy = rewardsCopy.gloria;

/**
 * Gloria ("glory points") on Vidi: the journey's total, then this week by day. A bar in full gold
 * reached a conquered day's worth; days still to come stay empty. Older days, months and years
 * live on their own screen, so the card stays a summary on Vidi.
 */
export function GloriaCard({ total, thisWeek, conqueredDay, today, onOpenHistory }: GloriaCardProps) {
  const styles = useStyles();
  const theme = useTheme();
  const play = useFeedback();
  const bars: WeekBar[] = thisWeek.map(({ day, gloria }) => ({
    day,
    value: day > today ? null : gloria,
    tone: day > today || gloria <= 0 ? 'empty' : conqueredDay > 0 && gloria >= conqueredDay ? 'full' : 'held',
  }));
  const weekTotal = thisWeek.reduce((sum, day) => sum + day.gloria, 0);

  return (
    <Card glow={{ color: 'accent', origin: 'bottomRight', intensity: 0.4 }}>
      <View style={styles.header}>
        <View style={styles.title}>
          <Icon name="laurel" color="accent" />
          <View>
            <Txt variant="label" accessibilityRole="header">
              {copy.section}
            </Txt>
            <Txt variant="micro">{copy.plain}</Txt>
          </View>
        </View>
        <View style={styles.total}>
          <RollingNumber
            value={copy.total(total)}
            variant="display"
            color="accent"
            accessibilityLabel={copy.totalLabel(total)}
          />
          <Txt variant="micro">{copy.weekTotal(weekTotal)}</Txt>
        </View>
      </View>
      <View style={styles.chart}>
        <WeekBarChart
          bars={bars}
          max={chartMax(
            bars.map((bar) => bar.value),
            conqueredDay,
          )}
          target={conqueredDay}
          weekdayInitials={progressCopy.calendar.weekdayInitials}
          formatValue={(value) => (value > 0 ? copy.total(value) : '')}
          describeBar={(bar) =>
            copy.describeBar(commonCopy.weekdays[weekdayIndex(bar.day)] ?? bar.day, bar.value ?? 0)
          }
        />
      </View>
      {onOpenHistory ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.historyLabel}
          onPress={() => {
            play('tap');
            onOpenHistory();
          }}
          style={({ pressed }) => [styles.history, pressed && styles.pressed]}
        >
          <Icon name="history" color="accent" size={theme.layout.iconSizeSmall} />
          <Txt variant="label" color="accent" style={styles.historyText}>
            {copy.history}
          </Txt>
          <Icon name="forward" color="accent" size={theme.layout.iconSizeSmall} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
  title: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, flexShrink: 1 },
  total: { alignItems: 'flex-end' },
  chart: { marginTop: theme.space.lg, marginBottom: theme.space.sm },
  history: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: theme.layout.minTouchTarget,
    marginTop: theme.space.sm,
    borderTopWidth: theme.layout.hairline,
    borderTopColor: theme.colors.border,
  },
  historyText: { flex: 1 },
  pressed: { opacity: 0.6 },
}));
