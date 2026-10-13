import { Image, View } from 'react-native';

import { commonCopy, ordersCopy, progressCopy, proofCopy } from '@/copy';
import type { OrderTargets } from '@/features/orders';
import { type DaySummaryOrder, useDaySummary } from '@/hooks/useDaySummary';
import { type DayKey, formatClockTime } from '@/lib/dates';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { ProgressBar } from '../ProgressBar';
import { StatusCircle } from '../StatusCircle';
import { Txt } from '../Txt';

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
/** Queried while closed; matches nothing. */
const NO_DAY = '0000-01-01';

/** A calendar day, opened: each order against its goal, sleep, weight, calories, selfie, to-dos. */
export function DaySummarySheet({ day, status, isLudus, arcId, targets, onClose }: DaySummarySheetProps) {
  const styles = useStyles();
  const summary = useDaySummary(day ?? NO_DAY, arcId, targets, ordersCopy.vincoNames);
  const statusLabel =
    status === 'missed' && isLudus
      ? copy.restDay
      : status === 'conquered' || status === 'held' || status === 'truce' || status === 'missed'
        ? copy.status[status]
        : copy.status.open;

  return (
    <BottomSheet
      visible={day != null}
      onClose={onClose}
      title={day ? commonCopy.fullDateLabel(day) : undefined}
    >
      {day && summary.isLoaded ? (
        <View style={styles.body}>
          <View style={styles.top}>
            <View style={styles.topText}>
              <Txt
                variant="label"
                color={status === 'conquered' || status === 'held' ? 'accent' : 'textMuted'}
              >
                {statusLabel}
              </Txt>
              <Txt variant="caption">{copy.tasks(summary.tasksDone)}</Txt>
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
                <Txt variant="micro" align="center">
                  {copy.noSelfie}
                </Txt>
              </View>
            )}
          </View>

          <Txt variant="overline" style={styles.heading}>
            {copy.ordersTitle}
          </Txt>
          {summary.orders.length === 0 ? <Txt variant="caption">{copy.noOrders}</Txt> : null}
          {summary.orders.map((order) => (
            <View key={order.key} style={styles.order}>
              <StatusCircle status={order.status} size={styles.circle.width} />
              <View style={styles.orderText}>
                <View style={styles.orderHead}>
                  <Txt variant="labelSmall" numberOfLines={1} style={styles.orderName}>
                    {order.name}
                  </Txt>
                  <Txt variant="caption">{describeAmount(order)}</Txt>
                </View>
                <ProgressBar
                  value={order.full > 0 ? Math.min(1, order.amount / order.full) : 0}
                  size="thin"
                />
              </View>
            </View>
          ))}

          <Txt variant="overline" style={styles.heading}>
            {copy.bodyTitle}
          </Txt>
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
              value={summary.calories != null ? `${proofCopy.kcal(summary.calories)} kcal` : copy.notLogged}
            />
          </View>
        </View>
      ) : null}
    </BottomSheet>
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

/** "2 of 4 L", "1 of 2 meals", "8 of 12 glass". */
function describeAmount(order: DaySummaryOrder): string {
  const litres = (value: number) => `${Number(value.toFixed(2))}`;
  switch (order.kind) {
    case 'water':
      return copy.water(litres(order.amount), litres(order.full));
    case 'meal':
      return copy.meal(order.amount, order.full);
    case 'workout':
      return copy.workout(Math.round(order.amount), order.full);
    case 'wake':
      return copy.wake(order.amount > 0);
    case null:
      return copy.own(order.amount, order.full, order.unit);
  }
}

const useStyles = createStyles((theme) => ({
  body: { marginTop: theme.space.xs },
  top: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  topText: { flex: 1, gap: theme.space.xxs },
  selfie: {
    width: theme.space.giant,
    height: theme.space.giant + theme.space.lg,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
  },
  noSelfie: { alignItems: 'center', justifyContent: 'center', padding: theme.space.xs },
  heading: { marginTop: theme.space.lg, marginBottom: theme.space.sm },
  order: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, marginBottom: theme.space.sm },
  circle: { width: theme.layout.iconSize },
  orderText: { flex: 1, minWidth: 0, gap: theme.space.xs },
  orderHead: { flexDirection: 'row', alignItems: 'baseline', gap: theme.space.sm },
  orderName: { flex: 1 },
  facts: { flexDirection: 'row', gap: theme.space.sm },
  fact: {
    flex: 1,
    padding: theme.space.sm,
    gap: theme.space.xxs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
  },
}));
