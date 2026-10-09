import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { AddOrderSheet } from '@/components/orders/AddOrderSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Txt } from '@/components/Txt';
import { ordersCopy } from '@/copy';
import {
  CUSTOM_ORDER_LIMITS,
  type CustomOrder,
  ORDER_KINDS,
  type OrderKind,
  type OrderTargets,
} from '@/features/orders';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useOwnOrderActions } from '@/hooks/useOwnOrderActions';
import { useTodayOrders } from '@/hooks/useTodayOrders';
import { formatClockMinutes, parseClockMinutes } from '@/lib/dates';
import { createStyles, useFeedback } from '@/theme';

/**
 * Your orders: Vinco's four (fixed) and the user's own (add, stand down).
 * Every order must hold for the day to count. See docs/ORDERS-AND-TASKS.md.
 */
export default function OrdersScreen() {
  const styles = useStyles();
  const play = useFeedback();
  const { arc, targets } = useActiveArc();
  const orders = useTodayOrders(targets, arc?.id ?? null);
  const ownOrders = useOwnOrderActions(arc?.id ?? null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [standingDown, setStandingDown] = useState<CustomOrder | null>(null);
  const own = orders.customOrders.map((item) => item.order);
  const activeCount = own.filter((order) => order.lastDay == null).length;
  const canAdd = arc != null && activeCount < CUSTOM_ORDER_LIMITS.maxActive;

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/vici');
  };

  const confirmStandDown = () => {
    if (!standingDown) return;
    play(ownOrders.standDown(standingDown.id) ? 'stepDown' : 'denied');
    setStandingDown(null);
  };

  return (
    <>
      <Screen gutter="flow" edges={['top', 'bottom']}>
        <View style={styles.nav}>
          <IconButton icon="back" accessibilityLabel={ordersCopy.screen.back} onPress={back} />
        </View>
        <ScreenHeader eyebrow={ordersCopy.screen.eyebrow} title={ordersCopy.screen.title} />
        <Txt variant="caption" style={styles.intro}>
          {ordersCopy.screen.intro}
        </Txt>

        <SectionHeader title={ordersCopy.screen.vincoSection} />
        <View style={styles.list}>
          {ORDER_KINDS.map((kind) => (
            <View key={kind} style={styles.card}>
              <Txt variant="label">{ordersCopy.vincoNames[kind]}</Txt>
              <Txt variant="caption">{describeVincoGoals(kind, targets, arc?.wakeTime ?? null)}</Txt>
            </View>
          ))}
        </View>

        <SectionHeader title={ordersCopy.screen.ownSection} />
        <View style={styles.list}>
          {own.length === 0 ? <Txt variant="caption">{ordersCopy.screen.ownEmpty}</Txt> : null}
          {own.map((order) => (
            <View key={order.id} style={[styles.card, styles.ownCard]}>
              <View style={styles.ownText}>
                <Txt variant="label">{order.name}</Txt>
                <Txt variant="caption">{describeOwnGoals(order)}</Txt>
                {order.lastDay != null ? (
                  <Txt variant="caption" color="danger">
                    {ordersCopy.screen.standsDownTomorrow}
                  </Txt>
                ) : null}
              </View>
              {order.lastDay == null ? (
                <Button
                  label={ordersCopy.screen.standDown}
                  variant="ghost"
                  size="compact"
                  onPress={() => setStandingDown(order)}
                />
              ) : null}
            </View>
          ))}
        </View>

        {canAdd ? (
          <View style={styles.add}>
            <Button label={ordersCopy.add.title} variant="secondary" onPress={() => setIsAddOpen(true)} />
          </View>
        ) : arc ? (
          <Txt variant="caption" style={styles.add}>
            {ordersCopy.add.limit(CUSTOM_ORDER_LIMITS.maxActive)}
          </Txt>
        ) : null}
      </Screen>

      <AddOrderSheet
        visible={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={(draft) => {
          const result = ownOrders.add(draft);
          if (result === null) setIsAddOpen(false);
          return result;
        }}
      />

      <BottomSheet
        visible={standingDown != null}
        onClose={() => setStandingDown(null)}
        title={standingDown ? ordersCopy.standDownSheet.title(standingDown.name) : undefined}
      >
        <Txt variant="body" color="textMuted">
          {standingDown?.firstDay === orders.today
            ? ordersCopy.standDownSheet.bodyAddedToday
            : ordersCopy.standDownSheet.body}
        </Txt>
        <View style={styles.sheetActions}>
          <Button
            label={ordersCopy.standDownSheet.confirm}
            variant="danger"
            cue={null}
            onPress={confirmStandDown}
          />
          <Button
            label={ordersCopy.standDownSheet.cancel}
            variant="ghost"
            cue={null}
            onPress={() => setStandingDown(null)}
          />
        </View>
      </BottomSheet>
    </>
  );
}

/** "Hold the line: 1 L · Conquer: 4 L" for one of Vinco's four. */
function describeVincoGoals(kind: OrderKind, targets: OrderTargets, wakeTime: string | null): string {
  const goals = ordersCopy.vincoGoals;
  const target = targets[kind];
  switch (kind) {
    case 'water':
      return ordersCopy.screen.goals(goals.water(target.min), goals.water(target.full));
    case 'wake': {
      const minutes = wakeTime ? parseClockMinutes(wakeTime) : null;
      return ordersCopy.wakeLine(minutes == null ? null : formatClockMinutes(minutes));
    }
    case 'meal':
      return ordersCopy.screen.goals(goals.meal(target.min), goals.meal(target.full));
    case 'workout':
      return ordersCopy.screen.goals(goals.workout(target.min), goals.workout(target.full));
  }
}

/** "Hold the line: 10 pages · Conquer: 30 pages" for an own order. */
function describeOwnGoals(order: CustomOrder): string {
  const withUnit = (value: number) => (order.unit ? `${value} ${order.unit}` : String(value));
  return ordersCopy.screen.goals(withUnit(order.min), withUnit(order.full));
}

const useStyles = createStyles((theme) => ({
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: theme.space.sm },
  intro: { marginTop: theme.space.sm },
  list: { gap: theme.space.sm },
  card: {
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    gap: theme.space.xxs,
  },
  ownCard: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  ownText: { flex: 1, minWidth: 0, gap: theme.space.xxs },
  add: { marginTop: theme.space.xxl, marginBottom: theme.space.lg },
  sheetActions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
