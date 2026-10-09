import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { AddOrderSheet } from '@/components/orders/AddOrderSheet';
import { TimelapseTile } from '@/components/proof/TimelapseTile';
import { WeightSheet } from '@/components/proof/WeightSheet';
import { WeightTile } from '@/components/proof/WeightTile';
import { StatChip } from '@/components/StatChip';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { DawnCard } from '@/components/today/DawnCard';
import { SealDayCard } from '@/components/today/SealDayCard';
import { SickDayCard } from '@/components/today/SickDayCard';
import { SickDaySheet } from '@/components/today/SickDaySheet';
import { SelfieTile } from '@/components/today/SelfieTile';
import { StampOverlay } from '@/components/today/StampOverlay';
import { TaskRow } from '@/components/today/TaskRow';
import { TodoTile } from '@/components/today/TodoTile';
import { FEATURES } from '@/config/features';
import { TruceBanner } from '@/components/today/TruceBanner';
import { WakeSheet } from '@/components/today/WakeSheet';
import { WorkoutSheet } from '@/components/today/WorkoutSheet';
import { ToneLine } from '@/components/ToneLine';
import { Txt } from '@/components/Txt';
import { commonCopy, pickTone, todayCopy } from '@/copy';
import { arcEndDay, getArcPosition } from '@/features/arc';
import { planTrucePayment } from '@/features/campaign';
import {
  CUSTOM_ORDER_LIMITS,
  maxAmountFor,
  ORDER_KINDS,
  type OrderKind,
  type OrderStatus,
} from '@/features/orders';
import { sleepMinutesFromMoments, toWakeMoments } from '@/features/sleep';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useCampaign } from '@/hooks/useCampaign';
import { useDailySelfie } from '@/hooks/useDailySelfie';
import { useLatestBedtime } from '@/hooks/useLatestBedtime';
import { useSelfieReel } from '@/hooks/useSelfieReel';
import { useSickDay } from '@/hooks/useSickDay';
import { useOwnOrderActions } from '@/hooks/useOwnOrderActions';
import { useTasks } from '@/hooks/useTasks';
import { type TodayOrders, useTodayOrders } from '@/hooks/useTodayOrders';
import {
  type DayKey,
  daysLeftInYear,
  formatClockMinutes,
  formatClockTime,
  parseClockMinutes,
  parseDayKey,
  toDayKey,
  weekdayIndex,
} from '@/lib/dates';
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
  const latestBedtime = useLatestBedtime(orders.today);
  const [isWorkoutSheetOpen, setIsWorkoutSheetOpen] = useState(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [isWakeSheetOpen, setIsWakeSheetOpen] = useState(false);
  const [isWeightSheetOpen, setIsWeightSheetOpen] = useState(false);
  const [isSickSheetOpen, setIsSickSheetOpen] = useState(false);
  const [sickError, setSickError] = useState<string | null>(null);
  const sickDay = useSickDay(orders.today);
  const reel = useSelfieReel('arc', activeArc.arc, orders.today);
  const { today, targets, statuses, heldCount, totalCount } = orders;
  const activeOwnOrders = orders.customOrders.filter((item) => item.order.lastDay == null).length;
  const canAddOrder =
    FEATURES.customOrders && activeArc.arc != null && activeOwnOrders < CUSTOM_ORDER_LIMITS.maxActive;

  const weekday = commonCopy.weekdays[weekdayIndex(today)] ?? '';
  const caption = commonCopy.daysLeftInYear(daysLeftInYear(today), parseDayKey(today).year);
  const header = describeArcHeader(activeArc.arc, today);
  const isLoaded = orders.isLoaded && activeArc.isLoaded;
  // Until wake-up is logged, the day opens on the dawn card and the orders wait.
  const isAwake = orders.amounts.wake > 0;
  // A sick day skips the dawn: the orders stay open in case the user manages them anyway.
  const isDawn = activeArc.arc != null && isLoaded && !isAwake && !orders.isSickDay;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // The dev clock can run ahead: then "now" isn't on today and there is no future check.
  const isRealToday = toDayKey(now) === today;
  const plannedWakeMinutes = activeArc.arc ? parseClockMinutes(activeArc.arc.wakeTime) : null;
  const wokeMinutes = orders.wokeAt ? orders.wokeAt.getHours() * 60 + orders.wokeAt.getMinutes() : null;
  const sleptMinutes = orders.sleptAt ? orders.sleptAt.getHours() * 60 + orders.sleptAt.getMinutes() : null;

  const playForStatus = (status: OrderStatus) => play(status === 'full' ? 'win' : 'tap');

  const handlePress = (kind: OrderKind) => {
    if (kind === 'wake') {
      play('tap');
      setIsWakeSheetOpen(true);
      return;
    }
    // The full goal isn't a ceiling: only the cap stops more being logged.
    if (orders.amounts[kind] >= maxAmountFor(kind, targets[kind])) {
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

  const handleWakeSave = (wakeMinutes: number, bedtimeMinutes: number) => {
    setIsWakeSheetOpen(false);
    const { wokeAt, sleptAt } = toWakeMoments(today, bedtimeMinutes, wakeMinutes);
    orders.logWakeUp(wokeAt, sleptAt);
  };

  const handleSickConfirm = () => {
    const problem = sickDay.call();
    if (problem === null) {
      setSickError(null);
      setIsSickSheetOpen(false);
      return;
    }
    play('denied');
    setSickError(problem === 'cannotAfford' ? null : todayCopy.sickDay.failed);
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
            <StatChip
              label={
                orders.isSickDay ? todayCopy.sickDay.chip : todayCopy.chips.truces(campaign.truceReserve)
              }
              emphasis="muted"
            />
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

        {isDawn ? (
          <View style={styles.notice}>
            <DawnCard
              hour={now.getHours()}
              plannedTime={plannedWakeMinutes != null ? formatClockMinutes(plannedWakeMinutes) : null}
              onRise={() => setIsWakeSheetOpen(true)}
              onFeelingSick={() => {
                setSickError(null);
                setIsSickSheetOpen(true);
              }}
            />
          </View>
        ) : null}
        {activeArc.arc && isLoaded && orders.isSickDay ? (
          <View style={styles.notice}>
            <SickDayCard
              onFeelingBetter={() => {
                if (!sickDay.cancel()) play('denied');
              }}
            />
          </View>
        ) : null}

        <SectionHeader title={todayCopy.ordersSection} />
        {isDawn ? (
          <Txt variant="caption" style={styles.waiting}>
            {todayCopy.dawn.waiting}
          </Txt>
        ) : isLoaded ? (
          <Txt variant="micro" color="textMuted" style={styles.waiting}>
            {todayCopy.ordersHint}
          </Txt>
        ) : null}
        {orders.hasSaveError ? (
          <Card variant="sunk" style={styles.error} accessibilityRole="alert">
            <Txt variant="caption" color="danger">
              {todayCopy.saveError}
            </Txt>
          </Card>
        ) : null}
        {/* Rows wait for the first read, so status circles don't pop on open. Before
            wake-up they show dimmed and can't be tapped: the dawn card is the first step. */}
        <View
          style={[styles.rows, isDawn && styles.rowsWaiting]}
          pointerEvents={isDawn ? 'none' : 'auto'}
          importantForAccessibility={isDawn ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={isDawn}
        >
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
        {/* Proof belongs to an arc: the selfies become the timelapse, the weights a trend. */}
        {activeArc.arc && isLoaded ? (
          <>
            <SectionHeader title={todayCopy.proofSection} />
            <View style={styles.rows}>
              <SelfieTile isTaken={selfie.todayPath != null} onPress={() => router.push('/selfie')} />
              <WeightTile
                today={today}
                todayKg={selfie.weightKg}
                latest={selfie.latestWeight}
                onPress={() => setIsWeightSheetOpen(true)}
              />
              {reel.frames.length >= 2 ? (
                <TimelapseTile
                  frames={reel.frames.length}
                  onPress={() => router.push({ pathname: '/timelapse', params: { scope: 'arc' } })}
                />
              ) : null}
            </View>
          </>
        ) : null}
        {FEATURES.tasks && activeArc.arc && isLoaded && tasks.isLoaded ? (
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

      <WakeSheet
        visible={isWakeSheetOpen}
        onClose={() => setIsWakeSheetOpen(false)}
        isEditing={isAwake}
        initialWakeMinutes={wokeMinutes ?? (isRealToday ? nowMinutes : (plannedWakeMinutes ?? nowMinutes))}
        initialBedtimeMinutes={sleptMinutes ?? latestBedtime}
        nowMinutes={isRealToday ? nowMinutes : null}
        onSave={handleWakeSave}
      />

      <SickDaySheet
        visible={isSickSheetOpen}
        onClose={() => setIsSickSheetOpen(false)}
        payment={planTrucePayment(1, campaign.truceReserve, campaign.denarii)}
        reserve={campaign.truceReserve}
        denarii={campaign.denarii}
        error={sickError}
        onConfirm={handleSickConfirm}
      />

      <WeightSheet
        visible={isWeightSheetOpen}
        onClose={() => setIsWeightSheetOpen(false)}
        currentKg={selfie.weightKg}
        onSave={(kg) => {
          selfie.saveWeight(kg);
          setIsWeightSheetOpen(false);
        }}
      />

      <WorkoutSheet
        visible={isWorkoutSheetOpen}
        onClose={() => setIsWorkoutSheetOpen(false)}
        target={targets.workout}
        maxMinutes={maxAmountFor('workout', targets.workout)}
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
      const sleep = sleepMinutesFromMoments(
        orders.sleptAt?.toISOString() ?? null,
        orders.wokeAt?.toISOString() ?? null,
      );
      const line = orders.wokeAt
        ? copy.doneLine(formatClockTime(orders.wokeAt), sleep != null ? commonCopy.duration(sleep) : null)
        : copy.idleLine;
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
  waiting: { marginBottom: theme.space.sm },
  rowsWaiting: { opacity: 0.45 },
  rows: { gap: theme.space.sm },
  proof: { marginTop: theme.space.lg },
  tile: { marginTop: theme.space.sm },
  error: {
    marginBottom: theme.space.sm,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.dangerBorder,
  },
}));
