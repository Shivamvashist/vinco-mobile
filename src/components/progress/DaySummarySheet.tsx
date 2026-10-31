import { Image, ScrollView, useWindowDimensions, View } from 'react-native';

import { commonCopy, ordersCopy, progressCopy, proofCopy, rewardsCopy } from '@/copy';
import type { OrderTargets } from '@/features/orders';
import { useDayRewards } from '@/hooks/useDayRewards';
import { useDaySummary } from '@/hooks/useDaySummary';
import { type DayKey, formatClockTime } from '@/lib/dates';
import { type ColorRole, createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Icon, type IconName } from '../Icon';
import { Txt } from '../Txt';

import { DayOrderRings } from './DayOrderRings';
import type { CalendarDayStatus } from './MonthCalendar';

export type DaySummarySheetProps = {
  /** The day to show, or null when closed. */
  day: DayKey | null;
  /** How the calendar reads the day ("conquered", "missed"...). */
  status: CalendarDayStatus;
  /** Free training: a missed day reads as a day off. */
  isLudus: boolean;
  arcId: number | null;
  targets: OrderTargets;
  onClose: () => void;
};

const copy = progressCopy.daySheet;
const rewards = rewardsCopy.daySheet;
/** Queried while closed; matches nothing. */
const NO_DAY = '1970-01-01';
/** The sheet scrolls past this share of the window. */
const MAX_HEIGHT_SHARE = 0.72;

/**
 * A calendar day (or today), opened: the result with its Gloria and denarii, the selfie, the
 * orders as rings, each focus, to-dos, then body and rest. A day with nothing logged says so.
 * Selfies are local files only.
 */
export function DaySummarySheet({ day, status, isLudus, arcId, targets, onClose }: DaySummarySheetProps) {
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const shown = day ?? NO_DAY;
  const summary = useDaySummary(shown, arcId, targets, ordersCopy.vincoNames);
  const dayRewards = useDayRewards(shown);
  const statusLabel =
    status === 'missed' && isLudus
      ? copy.restDay
      : status === 'conquered' || status === 'held' || status === 'truce' || status === 'missed'
        ? copy.status[status]
        : copy.status.open;
  const gloria = dayRewards.gloria?.total ?? 0;
  const isEmpty =
    summary.orders.every((order) => order.amount <= 0) &&
    summary.tasksDone === 0 &&
    dayRewards.focusSessions.length === 0 &&
    summary.selfiePath == null &&
    summary.weightKg == null &&
    summary.calories == null &&
    summary.wokeAt == null &&
    gloria === 0;

  return (
    <BottomSheet
      visible={day != null}
      onClose={onClose}
      title={day ? commonCopy.fullDateLabel(day) : undefined}
    >
      {day && summary.isLoaded && dayRewards.isLoaded ? (
        <ScrollView style={{ maxHeight: height * MAX_HEIGHT_SHARE }} contentContainerStyle={styles.body}>
          <View style={styles.top}>
            <View style={styles.topText}>
              <Txt
                variant="label"
                color={status === 'conquered' || status === 'held' ? 'accent' : 'textMuted'}
              >
                {statusLabel}
              </Txt>
              <View style={styles.chips}>
                <Chip icon="laurel" color="accent" text={rewards.gloria(gloria)} />
                <Chip icon="coin" color="currency" text={rewards.denarii(dayRewards.denarii)} />
              </View>
            </View>
            {summary.selfiePath ? (
              <Image
                source={{ uri: summary.selfiePath }}
                style={styles.selfie}
                accessibilityLabel={copy.selfieLabel(commonCopy.fullDateLabel(day))}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View style={[styles.selfie, styles.noSelfie]}>
                <Icon name="camera" color="textFaint" />
                <Txt variant="micro" align="center">
                  {copy.noSelfie}
                </Txt>
              </View>
            )}
          </View>

          {isEmpty ? (
            <Txt variant="body" color="textMuted" style={styles.empty}>
              {rewards.empty}
            </Txt>
          ) : (
            <>
              <Heading text={copy.ordersTitle} />
              {summary.orders.length === 0 ? (
                <Txt variant="caption">{copy.noOrders}</Txt>
              ) : (
                <DayOrderRings orders={summary.orders} />
              )}

              <Heading text={rewards.focusTitle} />
              {dayRewards.focusSessions.length === 0 ? (
                <Txt variant="caption">{rewards.noFocus}</Txt>
              ) : (
                <View style={styles.sessions}>
                  <Txt variant="labelSmall" color="accent">
                    {rewards.focusTotal(dayRewards.focusMinutes)}
                  </Txt>
                  {dayRewards.focusSessions.map((session) => (
                    <View key={session.id} style={styles.session}>
                      <Txt variant="caption" style={styles.sessionText} numberOfLines={1}>
                        {rewards.session(session.guard, session.minutes)}
                      </Txt>
                      <Txt variant="micro" color={session.status === 'completed' ? 'accent' : 'textMuted'}>
                        {rewards.results[session.status]}
                      </Txt>
                    </View>
                  ))}
                </View>
              )}

              <Heading text={rewards.todosTitle} />
              <Txt variant="caption">{copy.tasks(summary.tasksDone)}</Txt>

              <Heading text={copy.bodyTitle} />
              <View style={styles.facts}>
                <Fact
                  label={copy.sleep}
                  value={
                    summary.sleepMinutes != null
                      ? commonCopy.duration(summary.sleepMinutes)
                      : summary.wokeAt
                        ? copy.wokeAt(formatClockTime(summary.wokeAt))
                        : copy.notLogged
                  }
                />
                <Fact
                  label={copy.weight}
                  value={summary.weightKg != null ? `${proofCopy.kg(summary.weightKg)} kg` : copy.notLogged}
                />
                <Fact
                  label={copy.calories}
                  value={
                    summary.calories != null ? `${proofCopy.kcal(summary.calories)} kcal` : copy.notLogged
                  }
                />
              </View>
            </>
          )}
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

function Heading({ text }: { text: string }) {
  const styles = useStyles();
  return (
    <Txt variant="overline" style={styles.heading}>
      {text}
    </Txt>
  );
}

function Chip({ icon, color, text }: { icon: IconName; color: ColorRole; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.chip}>
      <Icon name={icon} size={styles.chipIcon.width} color={color} />
      <Txt variant="labelSmall" color={color}>
        {text}
      </Txt>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.fact}>
      <Txt variant="micro">{label}</Txt>
      <Txt variant="labelSmall">{value}</Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  body: { marginTop: theme.space.xs, paddingBottom: theme.space.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  topText: { flex: 1, gap: theme.space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    minHeight: theme.layout.chipHeight,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
  chipIcon: { width: theme.layout.iconSizeSmall },
  selfie: {
    width: theme.space.giant,
    height: theme.space.giant + theme.space.lg,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceSunk,
  },
  noSelfie: { alignItems: 'center', justifyContent: 'center', gap: theme.space.xxs, padding: theme.space.xs },
  empty: { marginTop: theme.space.xl },
  heading: { marginTop: theme.space.lg, marginBottom: theme.space.sm },
  sessions: { gap: theme.space.xs },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceSunk,
  },
  sessionText: { flex: 1 },
  facts: { flexDirection: 'row', gap: theme.space.sm },
  fact: {
    flex: 1,
    padding: theme.space.sm,
    gap: theme.space.xxs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceSunk,
  },
}));
