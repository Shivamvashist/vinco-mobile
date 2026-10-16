import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { ordersCopy } from '@/copy';
import { db, selectPendingCustomOrders, toCustomOrder } from '@/db';
import {
  CUSTOM_ORDER_LIMITS,
  type CustomOrder,
  DEFAULT_WAKE_MINUTES,
  isCheckOrder,
  type OrderKind,
  orderKindsIn,
  type OrderTarget,
  type TunableOrder,
} from '@/features/orders';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useOwnOrderActions } from '@/hooks/useOwnOrderActions';
import { useTodayOrders } from '@/hooks/useTodayOrders';
import { formatClockMinutes, parseClockMinutes } from '@/lib/dates';
import { createStyles, useFeedback } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { AddOrderSheet } from '../orders/AddOrderSheet';
import { VincoGoalSheet } from '../orders/VincoGoalSheet';
import { SectionHeader } from '../SectionHeader';
import { WakeTimeSheet } from '../settings/WakeTimeSheet';
import { Txt } from '../Txt';

export type OrdersPanelProps = {
  /** Opens the add-order step (shared with the to-do sheets). */
  onAdd: () => void;
};

/** Vinco's orders free training can add back, in the order they're offered. */
const ADDABLE_KINDS: readonly OrderKind[] = ['water', 'workout', 'meal'];

/** An own order on the plan, with the lower goal waiting for tomorrow if one was set. */
type OwnItem = { order: CustomOrder; next: CustomOrder | null };

/**
 * Vinco's orders and the user's own, each editable. A campaign keeps Vinco's four (their full
 * goals and the wake time can change); free training keeps only the ones picked, each
 * removable, with the rest offered to add. Own orders change name, unit and number, or stand
 * down. Every order must hold for the day to count. See docs/ORDERS-AND-TASKS.md.
 */
export function OrdersPanel({ onAdd }: OrdersPanelProps) {
  const styles = useStyles();
  const play = useFeedback();
  const { arc, targets } = useActiveArc();
  const orders = useTodayOrders(targets, arc?.id ?? null);
  const actions = useOwnOrderActions(arc?.id ?? null);
  const pending = useLiveQuery(selectPendingCustomOrders(db, arc?.id ?? -1, orders.today), [
    arc?.id,
    orders.today,
  ]);
  const [editingOwn, setEditingOwn] = useState<OwnItem | null>(null);
  const [standingDown, setStandingDown] = useState<CustomOrder | null>(null);
  const [editingVinco, setEditingVinco] = useState<TunableOrder | null>(null);
  const [isEditingWake, setIsEditingWake] = useState(false);
  const [removing, setRemoving] = useState<OrderKind | null>(null);
  const isFree = arc?.kind === 'ludus';
  const kinds = orderKindsIn(targets);
  const addable = isFree ? ADDABLE_KINDS.filter((kind) => !kinds.includes(kind)) : [];
  const own: OwnItem[] = orders.customOrders.map(({ order }) => {
    const row = pending.data.find((candidate) => candidate.replacesId === order.id);
    return { order, next: row ? toCustomOrder(row) : null };
  });
  // Still going: not standing down, or carried on by a lower goal from tomorrow.
  const isGoing = (item: OwnItem) => item.order.lastDay == null || item.next != null;
  const activeCount = own.filter(isGoing).length;
  const canAdd = arc != null && activeCount < CUSTOM_ORDER_LIMITS.maxActive;
  const wakeMinutes = (arc ? parseClockMinutes(arc.wakeTime) : null) ?? DEFAULT_WAKE_MINUTES;

  const editVinco = (kind: OrderKind) => {
    if (kind === 'wake') setIsEditingWake(true);
    else setEditingVinco(kind);
  };

  const confirmRemove = () => {
    if (!removing) return;
    play(actions.removeVinco(removing) ? 'stepDown' : 'denied');
    setRemoving(null);
  };

  const confirmStandDown = () => {
    if (!standingDown) return;
    play(actions.standDown(standingDown.id) ? 'stepDown' : 'denied');
    setStandingDown(null);
  };

  const editing = editingOwn ? (editingOwn.next ?? editingOwn.order) : null;

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
          {kinds.map((kind) => {
            const name = ordersCopy.vincoNames[kind];
            return (
              <View key={kind} style={styles.card}>
                <View style={styles.text}>
                  <Txt variant="label">{name}</Txt>
                  <Txt variant="caption">
                    {describeVincoGoals(kind, targets[kind], arc?.wakeTime ?? null)}
                  </Txt>
                </View>
                <Button
                  label={ordersCopy.screen.edit}
                  accessibilityLabel={ordersCopy.screen.editLabel(name)}
                  variant="ghost"
                  size="compact"
                  onPress={() => editVinco(kind)}
                />
                {/* Wake-up has no goal sheet to hold its Remove, so it keeps the button here. */}
                {isFree && kind === 'wake' ? (
                  <Button
                    label={ordersCopy.screen.remove}
                    variant="ghost"
                    size="compact"
                    onPress={() => setRemoving(kind)}
                  />
                ) : null}
              </View>
            );
          })}
          {addable.map((kind) => (
            <Button
              key={kind}
              label={ordersCopy.screen.addSuggestion(ordersCopy.vincoNames[kind])}
              variant="secondary"
              size="compact"
              onPress={() => play(actions.addVinco(kind) ? 'confirm' : 'denied')}
            />
          ))}
        </View>

        <SectionHeader title={ordersCopy.screen.ownSection} />
        <View style={styles.list}>
          {own.length === 0 ? <Txt variant="caption">{ordersCopy.screen.ownEmpty}</Txt> : null}
          {own.map((item) => (
            <View key={`own-${item.order.id}`} style={styles.card}>
              <View style={styles.text}>
                <Txt variant="label">{item.order.name}</Txt>
                <Txt variant="caption">{describeOwnGoals(item.order)}</Txt>
                {item.next ? (
                  <Txt variant="caption" color="accent">
                    {ordersCopy.screen.fromTomorrow(describeOwnGoals(item.next))}
                  </Txt>
                ) : item.order.lastDay != null ? (
                  <Txt variant="caption" color="danger">
                    {ordersCopy.screen.standsDownTomorrow}
                  </Txt>
                ) : null}
              </View>
              {isGoing(item) ? (
                <Button
                  label={ordersCopy.screen.edit}
                  accessibilityLabel={ordersCopy.screen.editLabel(item.order.name)}
                  variant="ghost"
                  size="compact"
                  onPress={() => setEditingOwn(item)}
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

      <AddOrderSheet
        key={editingOwn ? `edit-${editingOwn.order.id}` : 'edit'}
        visible={editingOwn != null}
        onClose={() => setEditingOwn(null)}
        editing={
          editingOwn && editing
            ? {
                name: editing.name,
                unit: editing.unit,
                count: isCheckOrder(editing) ? null : editing.full,
                // Added today, it changes at once whatever the number.
                todayMin: editingOwn.order.firstDay === orders.today ? null : editingOwn.order.min,
                isTwoLevel: editing.min < editing.full,
              }
            : undefined
        }
        onSave={(draft) => {
          if (!editingOwn) return 'failed';
          const result = actions.edit(editingOwn.order.id, draft);
          if ('error' in result) return result.error;
          setEditingOwn(null);
          return null;
        }}
        onStandDown={() => {
          if (!editingOwn) return;
          setStandingDown(editingOwn.order);
          setEditingOwn(null);
        }}
      />

      <VincoGoalSheet
        key={editingVinco ?? 'vinco'}
        kind={editingVinco}
        target={editingVinco ? targets[editingVinco] : undefined}
        onClose={() => setEditingVinco(null)}
        onSave={actions.setVincoFull}
        onRemove={
          isFree
            ? (kind) => {
                setEditingVinco(null);
                setRemoving(kind);
              }
            : undefined
        }
      />

      <WakeTimeSheet
        visible={isEditingWake}
        onClose={() => setIsEditingWake(false)}
        minutes={wakeMinutes}
        onSave={actions.setWakeTime}
      />

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

/** "12 glass a day", "Once a day, done or not", or both goals for an older own order. */
function describeOwnGoals(order: CustomOrder): string {
  if (isCheckOrder(order)) return ordersCopy.screen.check;
  const withUnit = (value: number) => (order.unit ? `${value} ${order.unit}` : String(value));
  if (order.min === order.full) return ordersCopy.screen.daily(withUnit(order.full));
  return ordersCopy.screen.goals(withUnit(order.min), withUnit(order.full));
}

const useStyles = createStyles((theme) => ({
  intro: { marginTop: theme.space.sm },
  list: { gap: theme.space.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  text: { flex: 1, minWidth: 0, gap: theme.space.xxs },
  add: { marginTop: theme.space.xxl, marginBottom: theme.space.lg },
  sheetActions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
