import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/Card';
import { StatChip } from '@/components/StatChip';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SelfieTile } from '@/components/today/SelfieTile';
import { StampOverlay } from '@/components/today/StampOverlay';
import { TaskRow } from '@/components/today/TaskRow';
import { WorkoutSheet } from '@/components/today/WorkoutSheet';
import { ToneLine } from '@/components/ToneLine';
import { Txt } from '@/components/Txt';
import { commonCopy, pickTone, todayCopy } from '@/copy';
import { getArcPosition } from '@/features/arc';
import { ORDER_KINDS, type OrderKind, type OrderStatus } from '@/features/orders';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useCampaign } from '@/hooks/useCampaign';
import { useDailySelfie } from '@/hooks/useDailySelfie';
import { type TodayOrders, useTodayOrders } from '@/hooks/useTodayOrders';
import { type DayKey, daysLeftInYear, formatClockTime, parseDayKey, weekdayIndex } from '@/lib/dates';
import { toRoman } from '@/lib/toRoman';
import { usePreferencesStore } from '@/stores';
import { createStyles, useFeedback } from '@/theme';

/**
 * Veni: today's four orders. Tap a row to add progress, long-press to undo one step.
 * When all four hold, the VINCO stamp lands (once per day).
 */
export default function VeniScreen() {
  const styles = useStyles();
  const play = useFeedback();
  const tone = usePreferencesStore((state) => state.tone);
  const activeArc = useActiveArc();
  const orders = useTodayOrders(activeArc.targets);
  const campaign = useCampaign(activeArc.arc, activeArc.targets, orders.today);
  const selfie = useDailySelfie(orders.today);
  const [isWorkoutSheetOpen, setIsWorkoutSheetOpen] = useState(false);
  const { today, targets, statuses, heldCount } = orders;

  const weekday = commonCopy.weekdays[weekdayIndex(today)] ?? '';
  const caption = commonCopy.daysLeftInYear(daysLeftInYear(today), parseDayKey(today).year);
  const header = describeArcHeader(activeArc.arc, today);
  const isLoaded = orders.isLoaded && activeArc.isLoaded;

  const playForStatus = (status: OrderStatus) => play(status === 'full' ? 'win' : 'tap');

  const handlePress = (kind: OrderKind) => {
    if (statuses[kind] === 'full') {
      play('denied');
      return;
    }
    if (kind === 'workout') {
      play('tap');
      setIsWorkoutSheetOpen(true);
      return;
    }
    playForStatus(orders.addOne(kind));
  };

  const handleLongPress = (kind: OrderKind) => {
    if (orders.amounts[kind] <= 0) {
      play('denied');
      return;
    }
    play('stepDown');
    orders.undoOne(kind);
  };

  const handleWorkoutSave = (minutes: number, note: string) => {
    setIsWorkoutSheetOpen(false);
    playForStatus(orders.logWorkout(minutes, note));
  };

  return (
    <>
      <Screen>
        <ScreenHeader
          eyebrow={header.eyebrow}
          title={weekday}
          caption={caption}
          accessory={
            <ProgressRing
              value={heldCount / ORDER_KINDS.length}
              accessibilityLabel={todayCopy.ringLabel(heldCount, ORDER_KINDS.length)}
            >
              <Txt variant="headingSmall">{`${heldCount}/${ORDER_KINDS.length}`}</Txt>
            </ProgressRing>
          }
        />
        {activeArc.arc && campaign.isLoaded ? (
          <View style={styles.chips}>
            <StatChip icon="flame" label={todayCopy.chips.campaign(campaign.campaign)} />
            <StatChip
              label={campaign.isTruceAvailable ? todayCopy.chips.truceReady : todayCopy.chips.truceUsed}
              emphasis="muted"
            />
            {campaign.rank.current ? <StatChip label={campaign.rank.current.name} emphasis="muted" /> : null}
          </View>
        ) : null}
        <View style={styles.toneLine}>
          <ToneLine line={pickTone(todayCopy.progressLine(heldCount), tone)} tone={tone} />
        </View>

        <SectionHeader title={todayCopy.ordersSection} />
        {orders.hasSaveError ? (
          <Card variant="sunk" style={styles.error} accessibilityRole="alert">
            <Txt variant="caption" color="danger">
              {todayCopy.saveError}
            </Txt>
          </Card>
        ) : null}
        {/* Rows wait for the first read, so status circles don't pop on open. */}
        <View style={styles.rows}>
          {(isLoaded ? ORDER_KINDS : []).map((kind) => {
            const row = describeRow(kind, orders);
            return (
              <TaskRow
                key={kind}
                name={row.name}
                line={row.line}
                status={statuses[kind]}
                action={row.action}
                segments={row.segments}
                onPress={() => handlePress(kind)}
                onLongPress={() => handleLongPress(kind)}
                accessibilityLabel={`${row.name}, ${row.line}`}
                accessibilityHint={row.hint}
              />
            );
          })}
        </View>
        {/* The daily selfie belongs to an arc: it becomes the timelapse. */}
        {activeArc.arc && isLoaded ? (
          <View style={styles.proof}>
            <SelfieTile isTaken={selfie.todayPath != null} onPress={() => router.push('/selfie')} />
          </View>
        ) : null}
      </Screen>

      <WorkoutSheet
        visible={isWorkoutSheetOpen}
        onClose={() => setIsWorkoutSheetOpen(false)}
        target={targets.workout}
        onSave={handleWorkoutSave}
      />

      <StampOverlay
        visible={orders.isStampVisible}
        stampText={todayCopy.stamp.stampText}
        title={header.stampTitle}
        subtitle={todayCopy.stamp.subtitle}
        sealLabel={todayCopy.stamp.seal}
        backLabel={todayCopy.stamp.back}
        onSeal={() => {
          orders.dismissStamp();
          router.push('/day-card');
        }}
        onBack={orders.dismissStamp}
      />
    </>
  );
}

/** The eyebrow and stamp title, from where today falls in the arc. */
function describeArcHeader(
  arc: { startDay: DayKey; lengthDays: number } | null,
  today: DayKey,
): { eyebrow: string; stampTitle: string } {
  if (!arc) return { eyebrow: todayCopy.eyebrow, stampTitle: todayCopy.stamp.title };
  const position = getArcPosition(arc.startDay, arc.lengthDays, today);
  if (position.phase === 'finished') {
    return { eyebrow: todayCopy.arcFinishedEyebrow, stampTitle: todayCopy.stamp.title };
  }
  if (position.phase === 'notStarted')
    return { eyebrow: todayCopy.eyebrow, stampTitle: todayCopy.stamp.title };
  const dayRoman = toRoman(position.dayNumber);
  return {
    eyebrow: todayCopy.arcEyebrow(dayRoman, toRoman(position.lengthDays)),
    stampTitle: todayCopy.stamp.titleWithDay(dayRoman),
  };
}

type RowContent = {
  name: string;
  line: string;
  action: string;
  hint: string;
  segments?: { total: number; filled: number };
};

/** The words and bar for one order row, from today's state. */
function describeRow(kind: OrderKind, orders: TodayOrders): RowContent {
  const amount = orders.amounts[kind];
  const target = orders.targets[kind];
  const status = orders.statuses[kind];

  switch (kind) {
    case 'water': {
      const copy = todayCopy.orders.water;
      const total = Math.max(1, Math.ceil(target.full / target.step));
      const filled = status === 'full' ? total : Math.floor(amount / target.step);
      return {
        name: copy.name,
        line: copy.line(amount, target.full, status),
        action: copy.action,
        hint: copy.hint,
        segments: { total, filled },
      };
    }
    case 'wake': {
      const copy = todayCopy.orders.wake;
      const line = orders.wokeAt ? copy.doneLine(formatClockTime(orders.wokeAt)) : copy.idleLine;
      return { name: copy.name, line, action: copy.action, hint: copy.hint };
    }
    case 'meal': {
      const copy = todayCopy.orders.meal;
      return {
        name: copy.name,
        line: copy.line(amount, target.full, status),
        action: copy.action,
        hint: copy.hint,
      };
    }
    case 'workout': {
      const copy = todayCopy.orders.workout;
      const line =
        status === 'none' ? copy.idleLine(target.full) : copy.doneLine(amount, status, orders.workoutNote);
      return { name: copy.name, line, action: copy.action, hint: copy.hint };
    }
  }
}

const useStyles = createStyles((theme) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.md },
  toneLine: { marginTop: theme.space.lg },
  rows: { gap: theme.space.sm },
  proof: { marginTop: theme.space.lg },
  error: {
    marginBottom: theme.space.sm,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.dangerBorder,
  },
}));
