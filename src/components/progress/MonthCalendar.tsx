import { View } from 'react-native';

import { commonCopy, progressCopy } from '@/copy';
import { type DayKey, monthGrid, parseDayKey } from '@/lib/dates';
import { createStyles } from '@/theme';

import { IconButton } from '../IconButton';
import { Txt } from '../Txt';

/** How a day reads on the calendar. `open` is today before it's held; `outside` is not in the arc. */
export type CalendarDayStatus = 'conquered' | 'held' | 'truce' | 'missed' | 'open' | 'future' | 'outside';

export type CalendarDay = { status: CalendarDayStatus; isToday: boolean };

export type MonthCalendarProps = {
  year: number;
  month: number;
  describeDay: (day: DayKey) => CalendarDay;
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

const copy = progressCopy.calendar;
const LEGEND: { status: 'conquered' | 'held' | 'truce' | 'missed'; label: string }[] = [
  { status: 'conquered', label: copy.legend.conquered },
  { status: 'held', label: copy.legend.held },
  { status: 'truce', label: copy.legend.truce },
  { status: 'missed', label: copy.legend.missed },
];

/**
 * One month of the arc, Monday first: gold fill conquered, gold outline line held,
 * Truce in the rest colour, missed outlined in porphyry. Today is ringed.
 */
export function MonthCalendar({
  year,
  month,
  describeDay,
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
}: MonthCalendarProps) {
  const styles = useStyles();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Txt variant="label" accessibilityRole="header" style={styles.title}>
          {`${commonCopy.months[month - 1] ?? ''} ${year}`}
        </Txt>
        <View style={[styles.nav, !canGoBack && styles.hidden]}>
          <IconButton icon="back" accessibilityLabel={copy.previousMonth} onPress={onPrevious} />
        </View>
        <View style={[styles.nav, !canGoForward && styles.hidden]}>
          <IconButton icon="forward" accessibilityLabel={copy.nextMonth} onPress={onNext} />
        </View>
      </View>

      <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {copy.weekdayInitials.map((initial, index) => (
          <Txt key={`${initial}${index}`} variant="micro" align="center" style={styles.cell}>
            {initial}
          </Txt>
        ))}
      </View>

      {monthGrid(year, month).map((week, weekIndex) => (
        <View key={weekIndex} style={styles.row}>
          {week.map((day, dayIndex) =>
            day ? (
              <DayCell key={day} day={day} details={describeDay(day)} />
            ) : (
              <View key={`blank-${weekIndex}-${dayIndex}`} style={styles.cell} />
            ),
          )}
        </View>
      ))}

      <View style={styles.legend}>
        {LEGEND.map((item) => (
          <View key={item.status} style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles[item.status]]} />
            <Txt variant="micro">{item.label}</Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

type DayCellProps = { day: DayKey; details: CalendarDay };

function DayCell({ day, details }: DayCellProps) {
  const styles = useStyles();
  const { status, isToday } = details;
  const dateNumber = parseDayKey(day).day;
  const textColor =
    status === 'conquered' ? 'onAccent' : status === 'future' || status === 'outside' ? 'textFaint' : 'text';
  const statusWord = status === 'open' ? copy.statusWords.today : copy.statusWords[status];

  return (
    <View
      style={[styles.cell, styles.day, styles[status], isToday && styles.today]}
      accessible
      accessibilityLabel={copy.dayLabel(commonCopy.fullDateLabel(day), statusWord)}
    >
      <Txt variant="micro" color={textColor}>
        {dateNumber}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    padding: theme.space.lg,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSunk,
    gap: theme.space.xs + theme.space.xxs,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.space.xs },
  title: { flex: 1 },
  nav: { marginRight: -theme.space.sm },
  hidden: { opacity: 0, pointerEvents: 'none' },
  row: { flexDirection: 'row', gap: theme.space.xs + theme.space.xxs },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { borderRadius: theme.radius.sm },
  conquered: { backgroundColor: theme.colors.accent },
  held: { borderWidth: theme.layout.borderWidthStrong, borderColor: theme.colors.accent },
  truce: { backgroundColor: theme.colors.rest },
  missed: { borderWidth: theme.layout.borderWidthStrong, borderColor: theme.colors.dangerBorder },
  open: { backgroundColor: theme.colors.surface },
  future: { backgroundColor: theme.colors.surface },
  outside: {},
  today: { borderWidth: theme.layout.borderWidthStrong, borderColor: theme.colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, marginTop: theme.space.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs + theme.space.xxs },
  legendSwatch: { width: theme.space.md, height: theme.space.md, borderRadius: theme.radius.xs },
}));
