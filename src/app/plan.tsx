import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { OrdersPanel } from '@/components/plan/OrdersPanel';
import { TodoPanel } from '@/components/plan/TodoPanel';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TaskSheets, type TaskSheetTarget } from '@/components/tasks/TaskSheets';
import { FEATURES } from '@/config/features';
import { tasksCopy } from '@/copy';
import { arcEndDay } from '@/features/arc';
import { CUSTOM_ORDER_LIMITS } from '@/features/orders';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useOwnOrderActions } from '@/hooks/useOwnOrderActions';
import { useTasks } from '@/hooks/useTasks';
import { useTodayOrders } from '@/hooks/useTodayOrders';
import { createStyles } from '@/theme';

type Tab = 'orders' | 'todo';

const copy = tasksCopy.plan;
const TABS: readonly { value: Tab; label: string }[] = [
  { value: 'orders', label: copy.segments.orders },
  { value: 'todo', label: copy.segments.todo },
];

/**
 * "Orders and to-dos": one place to control everything the day holds. Orders decide the day;
 * to-dos plan it. Opened from Settings and from Today's to-do. See docs/ORDERS-AND-TASKS.md.
 */
export default function PlanScreen() {
  if (!FEATURES.customOrders && !FEATURES.tasks) return <Redirect href="/veni" />;
  return <PlanContent />;
}

function PlanContent() {
  const styles = useStyles();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { arc, targets } = useActiveArc();
  const orders = useTodayOrders(targets, arc?.id ?? null);
  const ownOrders = useOwnOrderActions(arc?.id ?? null);
  const tasks = useTasks(arc ? arcEndDay(arc.startDay, arc.lengthDays) : null);
  const firstTab: Tab = params.tab === 'todo' || !FEATURES.customOrders ? 'todo' : 'orders';
  const [tab, setTab] = useState<Tab>(firstTab);
  const [target, setTarget] = useState<TaskSheetTarget>(null);
  const activeOwn = orders.customOrders.filter((item) => item.order.lastDay == null).length;
  const canAddOrder = FEATURES.customOrders && arc != null && activeOwn < CUSTOM_ORDER_LIMITS.maxActive;
  const showTabs = FEATURES.customOrders && FEATURES.tasks;

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

  return (
    <>
      <Screen gutter="flow" edges={['top', 'bottom']}>
        <View style={styles.nav}>
          <IconButton icon="back" accessibilityLabel={copy.back} onPress={back} />
        </View>
        <ScreenHeader eyebrow={copy.eyebrow} title={copy.title} />
        {showTabs ? (
          <View style={styles.tabs}>
            <SegmentedControl options={TABS} value={tab} onChange={setTab} />
          </View>
        ) : null}
        <View style={styles.body}>
          {tab === 'orders' ? (
            <OrdersPanel onAdd={() => setTarget({ type: 'order' })} />
          ) : (
            <TodoPanel
              tasks={tasks}
              onAdd={() => setTarget({ type: 'add' })}
              onEdit={(item) => setTarget({ type: 'edit', item })}
            />
          )}
        </View>
      </Screen>

      <TaskSheets
        target={target}
        onClose={() => setTarget(null)}
        tasks={tasks}
        ownOrders={ownOrders}
        canAddOrder={canAddOrder}
      />
    </>
  );
}

const useStyles = createStyles((theme) => ({
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: theme.space.sm },
  tabs: { marginTop: theme.space.lg },
  body: { marginTop: theme.space.sm },
}));
