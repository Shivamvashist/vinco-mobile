import { ScrollView, useWindowDimensions, View } from 'react-native';

import { todayCopy } from '@/copy';
import { type DayActivity, type DayActivityKind, familyOf } from '@/features/dayPath';
import { formatClockTime } from '@/lib/dates';
import { type ColorRole, createStyles, useFeedback } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { PressableScale } from '../PressableScale';
import { Txt } from '../Txt';

export type TodaySummarySheetProps = {
  visible: boolean;
  onClose: () => void;
  held: number;
  total: number;
  /** Denarii paid live for today. */
  earned: number;
  /** Days in a row. */
  run: number;
  /** Today's activity, oldest first (the marks on the day path). */
  activity: readonly DayActivity[];
  /** Once today holds, the way to the day card. */
  canSeal: boolean;
  onOpenRun: () => void;
  onOpenDayCard: () => void;
};

const copy = todayCopy.summary;
/** The timeline scrolls past this share of the window. */
const MAX_HEIGHT_SHARE = 0.4;

const FAMILY_COLOR = { order: 'accent', focus: 'info', log: 'textMuted' } as const satisfies Record<
  ReturnType<typeof familyOf>,
  ColorRole
>;

type TimelineRow = { key: string; kind: DayActivityKind; at: Date; count: number };

/** Runs of the same kind in a row become one row ("Order ×3"), at the first one's time. */
function toTimeline(items: readonly DayActivity[]): TimelineRow[] {
  const rows: TimelineRow[] = [];
  for (const item of items) {
    const last = rows.at(-1);
    if (last && last.kind === item.kind) last.count += 1;
    else rows.push({ key: item.id, kind: item.kind, at: item.at, count: 1 });
  }
  return rows;
}

/**
 * Today, opened from the hero: three numbers (orders held, denarii today, the run), then the
 * day's timeline, and the day card once today holds. The run opens what it pays.
 */
export function TodaySummarySheet({
  visible,
  onClose,
  held,
  total,
  earned,
  run,
  activity,
  canSeal,
  onOpenRun,
  onOpenDayCard,
}: TodaySummarySheetProps) {
  const styles = useStyles();
  const play = useFeedback();
  const { height } = useWindowDimensions();
  const timeline = toTimeline(activity);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <View style={styles.stats}>
        <Stat
          value={`${held}/${total}`}
          label={copy.orders}
          color={total > 0 && held >= total ? 'accent' : 'text'}
          accessibilityLabel={copy.ordersLabel(held, total)}
        />
        <Stat
          value={`+${earned}`}
          label={copy.denarii}
          color="currency"
          accessibilityLabel={copy.denariiLabel(earned)}
        />
        <PressableScale
          scaleTo="row"
          accessibilityRole="button"
          accessibilityLabel={copy.runLabel(run)}
          onPress={() => {
            play('tap');
            onOpenRun();
          }}
          style={styles.statPress}
          containerStyle={styles.statCell}
        >
          <Stat value={String(run)} label={copy.run} color="info" />
        </PressableScale>
      </View>

      <Txt variant="overline" style={styles.heading}>
        {copy.timeline}
      </Txt>
      {timeline.length === 0 ? (
        <Txt variant="caption">{copy.empty}</Txt>
      ) : (
        <ScrollView style={{ maxHeight: height * MAX_HEIGHT_SHARE }} contentContainerStyle={styles.timeline}>
          {timeline.map((row) => (
            <View key={row.key} style={styles.row}>
              <Txt variant="labelSmall" color="textMuted" style={styles.time} numberOfLines={1}>
                {formatClockTime(row.at)}
              </Txt>
              <View style={[styles.dot, styles[FAMILY_COLOR[familyOf(row.kind)]]]} />
              <Txt variant="label" style={styles.kind} numberOfLines={1}>
                {copy.kinds[row.kind]}
                {row.count > 1 ? ` ${copy.times(row.count)}` : ''}
              </Txt>
            </View>
          ))}
        </ScrollView>
      )}

      {canSeal ? (
        <View style={styles.seal}>
          <Button
            label={copy.dayCard}
            variant="secondary"
            accessibilityHint={copy.dayCardHint}
            onPress={onOpenDayCard}
          />
        </View>
      ) : null}
    </BottomSheet>
  );
}

type StatProps = { value: string; label: string; color: ColorRole; accessibilityLabel?: string };

/** One number with its one-word label. */
function Stat({ value, label, color, accessibilityLabel }: StatProps) {
  const styles = useStyles();
  return (
    <View
      style={[styles.stat, accessibilityLabel ? styles.statCell : null]}
      accessible={accessibilityLabel != null}
      accessibilityLabel={accessibilityLabel}
    >
      <Txt variant="numeral" color={color} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {value}
      </Txt>
      <Txt variant="micro" numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  stats: { flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.xs },
  statCell: { flex: 1 },
  statPress: { flex: 1 },
  stat: {
    alignItems: 'center',
    gap: theme.space.xxs,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunk,
  },
  heading: { marginTop: theme.space.xl, marginBottom: theme.space.sm },
  timeline: { gap: theme.space.xs, paddingBottom: theme.space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md, minHeight: theme.space.xxl },
  time: { minWidth: theme.space.giant + theme.space.lg },
  dot: { width: theme.space.sm, height: theme.space.sm, borderRadius: theme.radius.pill },
  accent: { backgroundColor: theme.colors.accent },
  info: { backgroundColor: theme.colors.info },
  textMuted: { backgroundColor: theme.colors.textMuted },
  kind: { flex: 1 },
  seal: { marginTop: theme.space.xl },
}));
