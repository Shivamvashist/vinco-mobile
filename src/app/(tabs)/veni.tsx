import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { OrderAmountSheet } from '@/components/orders/OrderAmountSheet';
import { CaloriesSheet } from '@/components/proof/CaloriesSheet';
import { WeightSheet } from '@/components/proof/WeightSheet';
import { Screen } from '@/components/Screen';
import { TaskSheets, type TaskSheetTarget } from '@/components/tasks/TaskSheets';
import { buildOrderRows } from '@/components/today/buildOrderRows';
import { buildTodayLogs } from '@/components/today/buildTodayLogs';
import { describeArcHeader } from '@/components/today/describeArcHeader';
import { TodayHero } from '@/components/today/hero/TodayHero';
import { NoOrdersCard } from '@/components/today/NoOrdersCard';
import { SickDaySheet } from '@/components/today/SickDaySheet';
import { StampOverlay } from '@/components/today/StampOverlay';
import { TodayNotices } from '@/components/today/TodayNotices';
import { TodaySection } from '@/components/today/TodaySection';
import { WakeSheet } from '@/components/today/WakeSheet';
import { WorkoutSheet } from '@/components/today/WorkoutSheet';
import { todayCopy } from '@/copy';
import { FEATURES } from '@/config/features';
import { arcEndDay } from '@/features/arc';
import { planTrucePayment } from '@/features/campaign';
import { type CustomOrder, CUSTOM_ORDER_LIMITS, maxAmountFor, targetFor } from '@/features/orders';
import { toWakeMoments } from '@/features/sleep';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useCampaign } from '@/hooks/useCampaign';
import { useDailySelfie } from '@/hooks/useDailySelfie';
import { useDenariiNotice } from '@/hooks/useDenariiNotice';
import { useLatestBedtime } from '@/hooks/useLatestBedtime';
import { useLiveAwards } from '@/hooks/useLiveAwards';
import { useOrderTaps } from '@/hooks/useOrderTaps';
import { useOwnOrderActions } from '@/hooks/useOwnOrderActions';
import { useSickDay } from '@/hooks/useSickDay';
import { useTasks } from '@/hooks/useTasks';
import { useTodayOrders } from '@/hooks/useTodayOrders';
import { useWakeLink } from '@/hooks/useWakeLink';
import { parseClockMinutes, toDayKey } from '@/lib/dates';
import { useFeedback } from '@/theme';

type Sheet = 'wake' | 'workout' | 'weight' | 'calories' | 'sick' | null;

/**
 * Veni: the day, under the shared tabs header. One hero (the dawn card until wake-up is logged,
 * then the Dies card), the Reels and Focus tiles, then one section: Orders or Tasks. A Truce
 * offer, a save error or a finished arc show above the section only when they apply. When every
 * order is at its full goal the VINCO stamp lands. Opened as /veni?wake=1 (the "Are you up?"
 * notification), it opens the wake sheet if still at dawn.
 */
export default function VeniScreen() {
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
  const run = campaign.campaign;
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

  // From the "Are you up?" notification: straight into the wake sheet while the day is at dawn.
  useWakeLink(isLoaded, isDawn, () => setSheet('wake'));

  const taps = useOrderTaps(orders, {
    openSheet: setSheet,
    openAmount: (order, amount) => setAmountOrder({ order, amount }),
  });
  const { playForStatus } = taps;
  useLiveAwards(
    arc != null,
    targets,
    today,
    campaign.todayStatus,
    campaign.todayStatus === 'open' ? run : run - 1,
    isLoaded && campaign.isLoaded,
  );
  useDenariiNotice(campaign.todayEarned, campaign.isLoaded, today);

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

  const rows = isLoaded ? buildOrderRows(orders, taps) : [];
  const logs = buildTodayLogs(selfie, {
    weight: () => setSheet('weight'),
    calories: () => setSheet('calories'),
  });
  const ordersFooter =
    isLudus && totalCount === 0 && !isDawn ? (
      <NoOrdersCard onAddWater={() => !ownOrders.addVinco('water') && play('denied')} />
    ) : isLoaded && canAddOrder ? (
      <Button
        label={todayCopy.addOrder}
        variant="ghost"
        size="compact"
        onPress={() => setTodoTarget({ type: 'order' })}
      />
    ) : null;

  return (
    <>
      <Screen gutter="tabBody">
        {arc && isLoaded && campaign.isLoaded ? (
          <TodayHero
            orders={orders}
            campaign={campaign}
            isDawn={isDawn}
            isFinished={header.isFinished}
            plannedWakeMinutes={plannedWakeMinutes}
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
            onFeelingBetter={() => !sickDay.cancel() && play('denied')}
          />
        ) : null}

        <TodayNotices
          truceOffer={campaign.truceOffer}
          isFinished={header.isFinished}
          hasSaveError={orders.hasSaveError}
        />

        {arc ? (
          <TodaySection
            rows={rows}
            isWaiting={isDawn}
            ordersFooter={ordersFooter}
            tasks={{
              tasks: FEATURES.tasks && isLoaded && tasks.isLoaded ? tasks : null,
              logs,
              onAdd: () => setTodoTarget({ type: 'add' }),
              onEdit: (item) => setTodoTarget({ type: 'edit', item }),
              onOpenAll: () => router.push({ pathname: '/plan', params: { tab: 'todo' } }),
            }}
          />
        ) : null}
      </Screen>

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
