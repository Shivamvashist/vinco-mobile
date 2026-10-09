import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { AddOrderSheet } from '@/components/orders/AddOrderSheet';
import { StatChip } from '@/components/StatChip';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SealDayCard } from '@/components/today/SealDayCard';
import { SelfieTile } from '@/components/today/SelfieTile';
import { StampOverlay } from '@/components/today/StampOverlay';
import { TaskRow } from '@/components/today/TaskRow';
import { TodoTile } from '@/components/today/TodoTile';
import { TruceBanner } from '@/components/today/TruceBanner';
import { WorkoutSheet } from '@/components/today/WorkoutSheet';
import { ToneLine } from '@/components/ToneLine';
import { Txt } from '@/components/Txt';
import { commonCopy, pickTone, todayCopy } from '@/copy';
import { arcEndDay, getArcPosition } from '@/features/arc';
import { CUSTOM_ORDER_LIMITS, ORDER_KINDS, type OrderKind, type OrderStatus } from '@/features/orders';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useCampaign } from '@/hooks/useCampaign';
import { useDailySelfie } from '@/hooks/useDailySelfie';
import { useOwnOrderActions } from '@/hooks/useOwnOrderActions';
import { useTasks } from '@/hooks/useTasks';
import { type TodayOrders, useTodayOrders } from '@/hooks/useTodayOrders';
import { type DayKey, daysLeftInYear, formatClockTime, parseDayKey, weekdayIndex } from '@/lib/dates';
import { toRoman } from '@/lib/toRoman';
import { usePreferencesStore } from '@/stores';
import { createStyles, useFeedback } from '@/theme';

/**
 * Veni: today's orders (Vinco's four, then the user's own). Tap a row to add progress,
 * long-press to undo one step. When every order holds, the VINCO stamp lands (once per day)
 * and the seal card stays. Below: the selfie and the to-do list. See docs/ORDERS-AND-TASKS.md.
 */
export default function VeniScreen() {
  const styles = useStyles();
  const play = useFeedback();
  const tone = usePreferencesStore((state) => state.tone);
  const activeArc = useActiveArc();
  const arcId = activeArc.arc?.id ?? null;
  const orders = useTodayOrders(activeArc.targets, arcId);
  const campaign = useCampaign(activeArc.arc, activeArc.targets, orders.today);
  const selfie = useDailySelfie(orders.today);
  const tasks = useTasks(activeArc.arc ? arcEndDay(activeArc.arc.startDay, activeArc.arc.lengthDays) : null);
  const ownOrders = useOwnOrderActions(arcId);
  const [isWorkoutSheetOpen, setIsWorkoutSheetOpen] = useState(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const { today, targets, statuses, heldCount, totalCount } = orders;
  const activeOwnOrders = orders.customOrders.filter((item) => item.order.lastDay == null).length;
  const canAddOrder = activeArc.arc != null && activeOwnOrders < CUSTOM_ORDER_LIMITS.maxActive;

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

  const handleCustomPress = (orderId: number, status: OrderStatus) => {
    if (status === 'full') {
      play('denied');
      return;
    }
    playForStatus(orders.addOneCustom(orderId));
  };

  const handleCustomLongPress = (orderId: number, amount: number) => {
    if (amount <= 0) {
      play('denied');
      return;
    }
    play('stepDown');
    orders.undoOneCustom(orderId);
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
              value={totalCount > 0 ? heldCount / totalCount : 0}
              accessibilityLabel={todayCopy.ringLabel(heldCount, totalCount)}
            >
              <Txt variant="headingSmall">{`${heldCount}/${totalCount}`}</Txt>
            </ProgressRing>
          }
        />
        {activeArc.arc && campaign.isLoaded ? (
          <View style={styles.chips}>
            <StatChip icon="flame" label={todayCopy.chips.campaign(campaign.campaign)} />
            <StatChip label={todayCopy.chips.truces(campaign.truceReserve)} emphasis="muted" />
            {campaign.rank.current ? <StatChip label={campaign.rank.current.name} emphasis="muted" /> : null}
          </View>
        ) : null}
        <View style={styles.toneLine}>
          <ToneLine line={pickTone(todayCopy.progressLine(heldCount, totalCount), tone)} tone={tone} />
        </View>
        {campaign.truceOffer ? (
          <View style={styles.notice}>
            <TruceBanner
              campaign={campaign.truceOffer.campaignSaved}
              missedDays={campaign.truceOffer.days.length}
              onOpen={() => router.push('/campaign-lost')}
            />
          </View>
        ) : null}

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
          {(isLoaded ? orders.customOrders : []).map(({ order, amount, status }) => {
            const copy = todayCopy.customOrder;
            const line = copy.line(amount, order.min, order.full, order.unit, status);
            return (
              <TaskRow
                key={`own-${order.id}`}
                name={order.name}
                line={line}
                status={status}
                action={copy.action(status, order.min, order.full)}
                onPress={() => handleCustomPress(order.id, status)}
                onLongPress={() => handleCustomLongPress(order.id, amount)}
                accessibilityLabel={`${order.name}, ${line}`}
                accessibilityHint={copy.hint}
              />
            );
          })}
          {isLoaded && canAddOrder ? (
            <Button
              label={todayCopy.addOrder}
              variant="ghost"
              size="compact"
              onPress={() => setIsAddOrderOpen(true)}
            />
          ) : null}
        </View>
        {activeArc.arc && isLoaded && campaign.todayStatus !== 'open' ? (
          <View style={styles.proof}>
            <SealDayCard status={campaign.todayStatus} onSeal={() => router.push('/day-card')} />
          </View>
        ) : null}
        {/* The daily selfie belongs to an arc: it becomes the timelapse. */}
        {activeArc.arc && isLoaded ? (
          <View style={styles.proof}>
            <SelfieTile isTaken={selfie.todayPath != null} onPress={() => router.push('/selfie')} />
          </View>
        ) : null}
        {activeArc.arc && isLoaded && tasks.isLoaded ? (
          <View style={styles.tile}>
            <TodoTile summary={tasks.summary} onPress={() => router.push('/tasks')} />
          </View>
        ) : null}
      </Screen>

      <AddOrderSheet
        visible={isAddOrderOpen}
        onClose={() => setIsAddOrderOpen(false)}
        onSave={(draft) => {
          const result = ownOrders.add(draft);
          if (result === null) setIsAddOrderOpen(false);
          return result;
        }}
      />

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
  notice: { marginTop: theme.space.lg },
  rows: { gap: theme.space.sm },
  proof: { marginTop: theme.space.lg },
  tile: { marginTop: theme.space.sm },
  error: {
    marginBottom: theme.space.sm,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.dangerBorder,
  },
}));
