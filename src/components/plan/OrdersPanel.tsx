import { useState } from 'react';
import { View } from 'react-native';

import { ordersCopy } from '@/copy';
import {
  CUSTOM_ORDER_LIMITS,
  type CustomOrder,
  type OrderKind,
  orderKindsIn,
  type OrderTarget,
} from '@/features/orders';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useOwnOrderActions } from '@/hooks/useOwnOrderActions';
import { useTodayOrders } from '@/hooks/useTodayOrders';
import { formatClockMinutes, parseClockMinutes } from '@/lib/dates';
import { createStyles, useFeedback } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { SectionHeader } from '../SectionHeader';
import { Txt } from '../Txt';

export type OrdersPanelProps = {
  /** Opens the add-order step (shared with the to-do sheets). */
  onAdd: () => void;
};

/** Vinco's orders free training can add back, in the order they're offered. */
const ADDABLE_KINDS: readonly OrderKind[] = ['water', 'workout', 'meal'];

/**
 * Vinco's orders and the user's own. A campaign keeps Vinco's four (fixed); free training keeps
 * only the ones picked, each removable, with the rest offered to add. Own orders stand down.
 * Every order must hold for the day to count. See docs/ORDERS-AND-TASKS.md.
 */
export function OrdersPanel({ onAdd }: OrdersPanelProps) {
  const styles = useStyles();
  const play = useFeedback();
  const { arc, targets } = useActiveArc();
  const orders = useTodayOrders(targets, arc?.id ?? null);
  const ownOrders = useOwnOrderActions(arc?.id ?? null);
  const [standingDown, setStandingDown] = useState<CustomOrder | null>(null);
  const [removing, setRemoving] = useState<OrderKind | null>(null);
  const isFree = arc?.kind === 'ludus';
  const kinds = orderKindsIn(targets);
  const addable = isFree ? ADDABLE_KINDS.filter((kind) => !kinds.includes(kind)) : [];
  const own = orders.customOrders.map((item) => item.order);
  const activeCount = own.filter((order) => order.lastDay == null).length;
  const canAdd = arc != null && activeCount < CUSTOM_ORDER_LIMITS.maxActive;

  const confirmRemove = () => {
    if (!removing) return;
    play(ownOrders.removeVinco(removing) ? 'stepDown' : 'denied');
    setRemoving(null);
  };

  const confirmStandDown = () => {
    if (!standingDown) return;
    play(ownOrders.standDown(standingDown.id) ? 'stepDown' : 'denied');
    setStandingDown(null);
  };

  return (
    <>
      <View>
        <Txt variant="caption" style={styles.intro}>
          {isFree ? ordersCopy.screen.introFree : ordersCopy.screen.intro}
        </Txt>

        {kinds.length > 0 || addable.length > 0 ? (
          <SectionHeader
            title={isFree ? ordersCopy.screen.vincoSectionFree : ordersCopy.screen.vincoSection}
          />
        ) : null}
        <View style={styles.list}>
          {kinds.map((kind) => (
            <View key={kind} style={[styles.card, styles.ownCard]}>
              <View style={styles.ownText}>
                <Txt variant="label">{ordersCopy.vincoNames[kind]}</Txt>
                <Txt variant="caption">{describeVincoGoals(kind, targets[kind], arc?.wakeTime ?? null)}</Txt>
              </View>
              {isFree ? (
                <Button
                  label={ordersCopy.screen.remove}
                  variant="ghost"
                  size="compact"
                  onPress={() => setRemoving(kind)}
                />
              ) : null}
            </View>
          ))}
          {addable.map((kind) => (
            <Button
              key={kind}
              label={ordersCopy.screen.addSuggestion(ordersCopy.vincoNames[kind])}
              variant="secondary"
              size="compact"
              onPress={() => play(ownOrders.addVinco(kind) ? 'confirm' : 'denied')}
            />
          ))}
        </View>

        <SectionHeader title={ordersCopy.screen.ownSection} />
        <View style={styles.list}>
          {own.length === 0 ? <Txt variant="caption">{ordersCopy.screen.ownEmpty}</Txt> : null}
          {own.map((order) => (
            <View key={`own-${order.id}`} style={[styles.card, styles.ownCard]}>
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
            <Button label={ordersCopy.add.title} variant="secondary" onPress={onAdd} />
          </View>
        ) : arc ? (
          <Txt variant="caption" style={styles.add}>
            {ordersCopy.add.limit(CUSTOM_ORDER_LIMITS.maxActive)}
          </Txt>
        ) : null}
      </View>

      <BottomSheet
        visible={removing != null}
        onClose={() => setRemoving(null)}
        title={removing ? ordersCopy.removeSheet.title(ordersCopy.vincoNames[removing]) : undefined}
      >
        <Txt variant="body" color="textMuted">
          {ordersCopy.removeSheet.body}
        </Txt>
        <View style={styles.sheetActions}>
          <Button
            label={ordersCopy.removeSheet.confirm}
            variant="danger"
            cue={null}
            onPress={confirmRemove}
          />
          <Button
            label={ordersCopy.removeSheet.cancel}
            variant="ghost"
            cue={null}
            onPress={() => setRemoving(null)}
          />
        </View>
      </BottomSheet>

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

/** "Hold the line: 1 L · Conquer: 4 L" for one of Vinco's orders. */
function describeVincoGoals(
  kind: OrderKind,
  target: OrderTarget | undefined,
  wakeTime: string | null,
): string {
  const goals = ordersCopy.vincoGoals;
  if (!target) return '';
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

/** "12 glass a day", or "Hold the line: 10 pages · Conquer: 30 pages" for an older own order. */
function describeOwnGoals(order: CustomOrder): string {
  const withUnit = (value: number) => (order.unit ? `${value} ${order.unit}` : String(value));
  if (order.min === order.full) return ordersCopy.screen.daily(withUnit(order.full));
  return ordersCopy.screen.goals(withUnit(order.min), withUnit(order.full));
}

const useStyles = createStyles((theme) => ({
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
