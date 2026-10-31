import { Pressable, StyleSheet, View } from 'react-native';

import { commonCopy, progressCopy, rewardsCopy } from '@/copy';
import type { GloriaLevel } from '@/features/gloria';
import { type DayKey, monthGrid, parseDayKey } from '@/lib/dates';
import { createStyles, useFeedback } from '@/theme';

import { IconButton } from '../IconButton';
import { Txt } from '../Txt';

/**
 * How a day reads on the calendar. `open` is today before it's held; `rest` is a free-training
 * day without every order done (no streak, so not "missed"); `outside` is not in the arc.
 */
export type CalendarDayStatus =
  'conquered' | 'held' | 'truce' | 'missed' | 'rest' | 'open' | 'future' | 'outside';

export type CalendarDay = {
  status: CalendarDayStatus;
  isToday: boolean;
  /** False for a day that shows a result but has no summary here (an earlier arc's day). */
  canOpen?: boolean;
  /** How much Gloria the day earned, as a tint step (0 for none). */
  gloriaLevel?: GloriaLevel;
};

export type MonthCalendarProps = {
  year: number;
  month: number;
  describeDay: (day: DayKey) => CalendarDay;
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** Opens a day's summary. Days still to come, or outside the arc, can't be opened. */
  onDayPress?: (day: DayKey) => void;
  /** Free training: the legend leaves out Truces and misses. */
  isLudus?: boolean;
  /** Days carry a Gloria tint: the legend explains it. */
  showsGloria?: boolean;
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
  onDayPress,
  isLudus = false,
  showsGloria = false,
}: MonthCalendarProps) {
  const styles = useStyles();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Txt variant="label" accessibilityRole="header" style={styles.title}>
          {`${commonCopy.months[month - 1] ?? ''} ${year}`}
        </Txt>
        {/* At the first or last month the arrow stays in place, dimmed and disabled. */}
        <View style={styles.nav}>
          <IconButton
            icon="back"
            accessibilityLabel={copy.previousMonth}
            onPress={onPrevious}
            disabled={!canGoBack}
            cue="tap"
          />
        </View>
        <View style={styles.nav}>
          <IconButton
            icon="forward"
            accessibilityLabel={copy.nextMonth}
            onPress={onNext}
            disabled={!canGoForward}
            cue="tap"
          />
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
              <DayCell key={day} day={day} details={describeDay(day)} onPress={onDayPress} />
            ) : (
              <View key={`blank-${weekIndex}-${dayIndex}`} style={styles.cell} />
            ),
          )}
        </View>
      ))}

      <View style={styles.legend}>
        {LEGEND.filter((item) => !isLudus || item.status === 'conquered' || item.status === 'held').map(
          (item) => (
            <View key={item.status} style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles[item.status]]} />
              <Txt variant="micro">{item.label}</Txt>
            </View>
          ),
        )}
        {showsGloria ? (
          <View style={styles.legendItem}>
            <View style={styles.legendTints}>
              {GLORIA_TINTS.map((level) => (
                <View key={level} style={[styles.legendSwatch, styles.surfaceSwatch]}>
                  <View style={[styles.tint, styles[`tint${level}`]]} />
                </View>
              ))}
            </View>
            <Txt variant="micro">{rewardsCopy.gloria.calendarLegend}</Txt>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const GLORIA_TINTS = [1, 2, 3] as const;

type DayCellProps = { day: DayKey; details: CalendarDay; onPress?: (day: DayKey) => void };

function DayCell({ day, details, onPress }: DayCellProps) {
  const styles = useStyles();
  const play = useFeedback();
  const { status, isToday } = details;
  const dateNumber = parseDayKey(day).day;
  const textColor =
    status === 'conquered' ? 'onAccent' : status === 'future' || status === 'outside' ? 'textFaint' : 'text';
  const statusWord = status === 'open' ? copy.statusWords.today : copy.statusWords[status];

  const canOpen = onPress != null && details.canOpen !== false && status !== 'future' && status !== 'outside';
  const label = copy.dayLabel(commonCopy.fullDateLabel(day), statusWord);
  // Conquered days are already solid gold; every other day shows its Gloria as a gold wash.
  const level = status === 'conquered' ? 0 : (details.gloriaLevel ?? 0);
  const number = (
    <>
      {level > 0 ? (
        <View pointerEvents="none" style={[styles.tint, styles[`tint${level as 1 | 2 | 3}`]]} />
      ) : null}
      <Txt variant="micro" color={textColor}>
        {dateNumber}
      </Txt>
    </>
  );

  if (!canOpen) {
    return (
      <View
        style={[styles.cell, styles.day, styles[status], isToday && styles.today]}
        accessible
        accessibilityLabel={label}
      >
        {number}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={progressCopy.daySheet.hint}
      onPress={() => {
        play('tap');
        onPress(day);
      }}
      style={({ pressed }) => [
        styles.cell,
        styles.day,
        styles[status],
        isToday && styles.today,
        pressed && styles.pressed,
      ]}
    >
      {number}
    </Pressable>
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
  row: { flexDirection: 'row', gap: theme.space.xs + theme.space.xxs },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { borderRadius: theme.radius.sm, overflow: 'hidden' },
  /** The Gloria wash: the accent at three strengths, under the date and the result marks. */
  tint: { ...StyleSheet.absoluteFill, backgroundColor: theme.colors.accent },
  tint1: { opacity: 0.1 },
  tint2: { opacity: 0.2 },
  tint3: { opacity: 0.32 },
  legendTints: { flexDirection: 'row', gap: theme.space.xxs },
  surfaceSwatch: { backgroundColor: theme.colors.surface, overflow: 'hidden' },
  conquered: { backgroundColor: theme.colors.accent },
  held: { borderWidth: theme.layout.borderWidthStrong, borderColor: theme.colors.accent },
  truce: { backgroundColor: theme.colors.rest },
  missed: { borderWidth: theme.layout.borderWidthStrong, borderColor: theme.colors.dangerBorder },
  open: { backgroundColor: theme.colors.surface },
  rest: { backgroundColor: theme.colors.surface },
  future: { backgroundColor: theme.colors.surface },
  outside: {},
  today: { borderWidth: theme.layout.borderWidthStrong, borderColor: theme.colors.text },
  pressed: { opacity: 0.7 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, marginTop: theme.space.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs + theme.space.xxs },
  legendSwatch: { width: theme.space.md, height: theme.space.md, borderRadius: theme.radius.xs },
}));
