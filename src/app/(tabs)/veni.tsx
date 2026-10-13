import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { UserMenu } from '@/components/menu/UserMenu';
import { OrderAmountSheet } from '@/components/orders/OrderAmountSheet';
import { PlanOrderCard } from '@/components/orders/PlanOrderCard';
import { CaloriesSheet } from '@/components/proof/CaloriesSheet';
import { WeightSheet } from '@/components/proof/WeightSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatChip } from '@/components/StatChip';
import { TaskSheets, type TaskSheetTarget } from '@/components/tasks/TaskSheets';
import { buildOrderRows } from '@/components/today/buildOrderRows';
import { describeArcHeader } from '@/components/today/describeArcHeader';
import { DawnCard } from '@/components/today/DawnCard';
import { OrderList } from '@/components/today/OrderList';
import { QuickLogs } from '@/components/today/QuickLogs';
import { SealDayCard } from '@/components/today/SealDayCard';
import { SickDayCard } from '@/components/today/SickDayCard';
import { SickDaySheet } from '@/components/today/SickDaySheet';
import { StampOverlay } from '@/components/today/StampOverlay';
import { TodayTodo } from '@/components/today/TodayTodo';
import { TruceBanner } from '@/components/today/TruceBanner';
import { WakeSheet } from '@/components/today/WakeSheet';
import { WorkoutSheet } from '@/components/today/WorkoutSheet';
import { Txt } from '@/components/Txt';
import { commonCopy, proofCopy, todayCopy } from '@/copy';
import { FEATURES } from '@/config/features';
import { arcEndDay } from '@/features/arc';
import { planTrucePayment } from '@/features/campaign';
import {
  type CustomOrder,
  CUSTOM_ORDER_LIMITS,
  isTapCounted,
  maxAmountFor,
  type OrderKind,
  type OrderStatus,
  targetFor,
} from '@/features/orders';
import { toWakeMoments } from '@/features/sleep';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useCampaign } from '@/hooks/useCampaign';
import { useDailySelfie } from '@/hooks/useDailySelfie';
import { useLatestBedtime } from '@/hooks/useLatestBedtime';
import { useOwnOrderActions } from '@/hooks/useOwnOrderActions';
import { useSickDay } from '@/hooks/useSickDay';
import { useTasks } from '@/hooks/useTasks';
import { useTodayOrders } from '@/hooks/useTodayOrders';
import { formatClockMinutes, parseClockMinutes, toDayKey, weekdayIndex } from '@/lib/dates';
import { createStyles, useFeedback } from '@/theme';

type Sheet = 'wake' | 'workout' | 'weight' | 'calories' | 'sick' | 'menu' | null;

/**
 * Veni: the day. The header (with the user menu), the quick logs, then one scroll: the orders
 * (done ones sink to the bottom) and the to-do. When every order is at its full goal the VINCO
 * stamp lands. Free training (the 'ludus' kind) has no streak to lose, only a run to keep going.
 */
export default function VeniScreen() {
  const styles = useStyles();
  const play = useFeedback();
  const activeArc = useActiveArc();
  const { arc } = activeArc;
  const arcId = arc?.id ?? null;
  const orders = useTodayOrders(activeArc.targets, arcId);
  const campaign = useCampaign(arc, activeArc.targets, orders.today);
  const selfie = useDailySelfie(orders.today);
  const tasks = useTasks(arc ? arcEndDay(arc.startDay, arc.lengthDays) : null);
  const ownOrders = useOwnOrderActions(arcId);
  const latestBedtime = useLatestBedtime(orders.today);
  const sickDay = useSickDay(orders.today);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sickError, setSickError] = useState<string | null>(null);
  const [todoTarget, setTodoTarget] = useState<TaskSheetTarget>(null);
  const [amountOrder, setAmountOrder] = useState<{ order: CustomOrder; amount: number } | null>(null);
  const { today, targets, totalCount } = orders;
  const close = () => setSheet(null);

  const isLoaded = orders.isLoaded && activeArc.isLoaded;
  const isLudus = campaign.isLudus;
  const activeOwnOrders = orders.customOrders.filter((item) => item.order.lastDay == null).length;
  const canAddOrder = FEATURES.customOrders && arc != null && activeOwnOrders < CUSTOM_ORDER_LIMITS.maxActive;
  const header = describeArcHeader(arc, today);
  // Until wake-up is logged, the day opens on the dawn card and the orders wait.
  const isAwake = orders.amounts.wake > 0 || orders.wokeAt != null;
  // A sick day skips the dawn: the orders stay open in case the user manages them anyway.
  const isDawn = arc != null && isLoaded && !isAwake && !orders.isSickDay;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // The dev clock can run ahead: then "now" isn't on today and there is no future check.
  const isRealToday = toDayKey(now) === today;
  const plannedWakeMinutes = arc ? parseClockMinutes(arc.wakeTime) : null;
  const wokeMinutes = orders.wokeAt ? orders.wokeAt.getHours() * 60 + orders.wokeAt.getMinutes() : null;
  const sleptMinutes = orders.sleptAt ? orders.sleptAt.getHours() * 60 + orders.sleptAt.getMinutes() : null;

  const playForStatus = (status: OrderStatus) => play(status === 'full' ? 'win' : 'tap');

  const handlePress = (kind: OrderKind) => {
    if (kind === 'wake') {
      play('tap');
      setSheet('wake');
      return;
    }
    // The full goal isn't a ceiling: only the cap stops more being logged.
    if (orders.amounts[kind] >= maxAmountFor(kind, targetFor(targets, kind))) {
      play('denied');
      return;
    }
    if (kind === 'workout') {
      play('tap');
      setSheet('workout');
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

  // Small counts (glasses) go up one per tap; big ones (steps) are typed in.
  const handleOwnPress = (order: CustomOrder, amount: number) => {
    if (!isTapCounted(order)) {
      play('tap');
      setAmountOrder({ order, amount });
      return;
    }
    if (amount >= order.full) {
      play('denied');
      return;
    }
    playForStatus(orders.addOneCustom(order.id));
  };

  const handleOwnLongPress = (order: CustomOrder, amount: number) => {
    if (!isTapCounted(order)) {
      setAmountOrder({ order, amount });
      return;
    }
    if (amount <= 0) {
      play('denied');
      return;
    }
    play('stepDown');
    orders.undoOneCustom(order.id);
  };

  const handleSickConfirm = () => {
    const problem = sickDay.call();
    if (problem === null) {
      setSickError(null);
      close();
      return;
    }
    play('denied');
    setSickError(problem === 'cannotAfford' ? null : todayCopy.sickDay.failed);
  };

  const rows = isLoaded
    ? buildOrderRows(orders, {
        onPress: handlePress,
        onLongPress: handleLongPress,
        onPressOwn: handleOwnPress,
        onLongPressOwn: handleOwnLongPress,
      })
    : [];
  const run = campaign.campaign;
  const ordersNote = isDawn
    ? todayCopy.dawn.waiting
    : !isLoaded || totalCount === 0
      ? null
      : isLudus && campaign.todayStatus === 'open'
        ? run > 0
          ? todayCopy.run.nudge(run)
          : todayCopy.run.start
        : // Until something besides wake-up is logged, one line says how to log and take back.
          rows.every((row) => row.key === 'wake' || row.status === 'none')
          ? todayCopy.ordersHint
          : null;

  const noOrdersCard =
    isLudus && totalCount === 0 && !isDawn ? (
      <Card bordered style={styles.noOrders}>
        <Txt variant="label">{todayCopy.noOrders.title}</Txt>
        <Txt variant="caption">{todayCopy.noOrders.body}</Txt>
        <PlanOrderCard
          kind="suggestion"
          icon="water"
          name={todayCopy.noOrders.waterName}
          line={todayCopy.noOrders.waterLine}
          isAdded={false}
          onToggle={() => {
            if (!ownOrders.addVinco('water')) play('denied');
          }}
          addLabel={todayCopy.noOrders.add}
          addedLabel={todayCopy.noOrders.added}
        />
      </Card>
    ) : null;

  return (
    <>
      <Screen>
        <ScreenHeader
          eyebrow={header.eyebrow}
          title={commonCopy.weekdays[weekdayIndex(today)] ?? ''}
          accessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={todayCopy.menuLabel}
              onPress={() => {
                play('tap');
                setSheet('menu');
              }}
              style={({ pressed }) => [styles.userButton, pressed && styles.pressed]}
            >
              <Icon name="user" color="accent" />
            </Pressable>
          }
        />

        {arc && campaign.isLoaded ? (
          <View style={styles.chips}>
            {isLudus ? (
              run > 0 ? (
                <StatChip icon="flame" label={todayCopy.run.chip(run)} emphasis="muted" />
              ) : null
            ) : (
              <StatChip
                icon="flame"
                label={orders.isSickDay ? todayCopy.sickDay.chip : todayCopy.chips.campaign(run)}
              />
            )}
            <StatChip
              icon="coin"
              label={todayCopy.chips.denarii(campaign.denarii)}
              emphasis="currency"
              accessibilityHint={todayCopy.chips.denariiHint}
              onPress={() => router.push('/forum')}
            />
          </View>
        ) : null}

        {arc && isLoaded ? (
          <QuickLogs
            logs={[
              {
                key: 'selfie',
                icon: 'camera',
                label: selfie.todayPath ? todayCopy.quickLogs.selfieDone : todayCopy.quickLogs.selfie,
                isDone: selfie.todayPath != null,
                hint: todayCopy.quickLogs.selfieHint,
                onPress: () => router.push('/selfie'),
              },
              {
                key: 'weight',
                icon: 'scale',
                label:
                  selfie.weightKg != null
                    ? todayCopy.quickLogs.weightDone(proofCopy.kg(selfie.weightKg))
                    : todayCopy.quickLogs.weight,
                isDone: selfie.weightKg != null,
                hint: todayCopy.quickLogs.weightHint,
                onPress: () => setSheet('weight'),
              },
              {
                key: 'calories',
                icon: 'plate',
                label:
                  selfie.calories != null
                    ? todayCopy.quickLogs.caloriesDone(proofCopy.kcal(selfie.calories))
                    : todayCopy.quickLogs.calories,
                isDone: selfie.calories != null,
                hint: todayCopy.quickLogs.caloriesHint,
                onPress: () => setSheet('calories'),
              },
            ]}
          />
        ) : null}

        {campaign.truceOffer ? (
          <View style={styles.notice}>
            <TruceBanner
              campaign={campaign.truceOffer.campaignSaved}
              missedDays={campaign.truceOffer.days.length}
              onOpen={() => router.push('/campaign-lost')}
            />
          </View>
        ) : null}

        {header.isFinished ? (
          <Card bordered style={[styles.notice, styles.finished]}>
            <Txt variant="heading" accessibilityRole="header">
              {todayCopy.finished.title}
            </Txt>
            <Txt variant="body" color="textMuted">
              {todayCopy.finished.body}
            </Txt>
            <Button
              label={todayCopy.finished.action}
              size="compact"
              onPress={() => router.navigate('/vici')}
            />
          </Card>
        ) : null}

        {isDawn ? (
          <View style={styles.notice}>
            <DawnCard
              hour={now.getHours()}
              plannedTime={plannedWakeMinutes != null ? formatClockMinutes(plannedWakeMinutes) : null}
              onRise={() => setSheet('wake')}
              // Free training has no campaign to protect, so no sick-day Truce.
              onFeelingSick={
                isLudus
                  ? undefined
                  : () => {
                      setSickError(null);
                      setSheet('sick');
                    }
              }
            />
          </View>
        ) : null}
        {arc && isLoaded && orders.isSickDay ? (
          <View style={styles.notice}>
            <SickDayCard onFeelingBetter={() => !sickDay.cancel() && play('denied')} />
          </View>
        ) : null}

        {orders.hasSaveError ? (
          <Card variant="sunk" style={[styles.notice, styles.error]} accessibilityRole="alert">
            <Txt variant="caption" color="danger">
              {todayCopy.saveError}
            </Txt>
          </Card>
        ) : null}

        {arc ? (
          <OrderList
            rows={rows}
            isWaiting={isDawn}
            note={ordersNote}
            footer={
              noOrdersCard ??
              (isLoaded && canAddOrder ? (
                <Button
                  label={todayCopy.addOrder}
                  variant="ghost"
                  size="compact"
                  onPress={() => setTodoTarget({ type: 'order' })}
                />
              ) : null)
            }
          />
        ) : null}

        {arc && isLoaded && campaign.todayStatus !== 'open' ? (
          <View style={styles.notice}>
            <SealDayCard status={campaign.todayStatus} onSeal={() => router.push('/day-card')} />
          </View>
        ) : null}

        {FEATURES.tasks && arc && isLoaded && tasks.isLoaded ? (
          <TodayTodo
            tasks={tasks}
            onAdd={() => setTodoTarget({ type: 'add' })}
            onEdit={(item) => setTodoTarget({ type: 'edit', item })}
            onOpenAll={() => router.push({ pathname: '/plan', params: { tab: 'todo' } })}
          />
        ) : null}
      </Screen>

      <UserMenu visible={sheet === 'menu'} onClose={close} />
      <TaskSheets
        target={todoTarget}
        onClose={() => setTodoTarget(null)}
        tasks={tasks}
        ownOrders={ownOrders}
        canAddOrder={canAddOrder}
      />
      <OrderAmountSheet
        key={amountOrder?.order.id ?? 'none'}
        order={amountOrder?.order ?? null}
        amount={amountOrder?.amount ?? 0}
        onClose={() => setAmountOrder(null)}
        onSave={(amount) => {
          if (amountOrder) playForStatus(orders.setCustomAmount(amountOrder.order.id, amount));
          setAmountOrder(null);
        }}
      />
      <WakeSheet
        visible={sheet === 'wake'}
        onClose={close}
        isEditing={isAwake}
        initialWakeMinutes={wokeMinutes ?? (isRealToday ? nowMinutes : (plannedWakeMinutes ?? nowMinutes))}
        initialBedtimeMinutes={sleptMinutes ?? latestBedtime}
        nowMinutes={isRealToday ? nowMinutes : null}
        onSave={(wakeMinutes, bedtimeMinutes) => {
          close();
          const { wokeAt, sleptAt } = toWakeMoments(today, bedtimeMinutes, wakeMinutes);
          orders.logWakeUp(wokeAt, sleptAt);
        }}
      />
      <SickDaySheet
        visible={sheet === 'sick'}
        onClose={close}
        payment={planTrucePayment(1, campaign.truceReserve, campaign.denarii)}
        reserve={campaign.truceReserve}
        denarii={campaign.denarii}
        error={sickError}
        onConfirm={handleSickConfirm}
      />
      <WeightSheet
        visible={sheet === 'weight'}
        onClose={close}
        currentKg={selfie.weightKg}
        onSave={(kg) => {
          selfie.saveWeight(kg);
          close();
        }}
      />
      <CaloriesSheet
        visible={sheet === 'calories'}
        onClose={close}
        current={selfie.calories}
        onSave={(kcal) => {
          selfie.saveCalories(kcal);
          close();
        }}
      />
      <WorkoutSheet
        visible={sheet === 'workout'}
        onClose={close}
        target={targetFor(targets, 'workout')}
        maxMinutes={maxAmountFor('workout', targetFor(targets, 'workout'))}
        onSave={(minutes, note) => {
          close();
          playForStatus(orders.logWorkout(minutes, note));
        }}
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

const useStyles = createStyles((theme) => ({
  userButton: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
  },
  pressed: { opacity: 0.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.md },
  notice: { marginTop: theme.space.lg },
  finished: { gap: theme.space.sm },
  noOrders: { gap: theme.space.sm },
  error: { borderWidth: theme.layout.borderWidth, borderColor: theme.colors.dangerBorder },
}));
