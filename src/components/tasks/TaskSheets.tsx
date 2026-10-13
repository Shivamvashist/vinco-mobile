import { useState } from 'react';

import { CUSTOM_ORDER_LIMITS } from '@/features/orders';
import type { OwnOrderActions } from '@/hooks/useOwnOrderActions';
import type { TaskItem, Tasks } from '@/hooks/useTasks';

import { AddOrderSheet } from '../orders/AddOrderSheet';
import { TaskSheet } from './TaskSheet';

/** Which sheet is asked for: add something new, edit one task, or go straight to a new order. */
export type TaskSheetTarget = { type: 'add' } | { type: 'edit'; item: TaskItem } | { type: 'order' } | null;

export type TaskSheetsProps = {
  target: TaskSheetTarget;
  onClose: () => void;
  tasks: Tasks;
  ownOrders: OwnOrderActions;
  /** False with no arc, or with every own-order slot taken. */
  canAddOrder: boolean;
};

type OrderStep = { name: string; fromTaskId: number | null; key: number };

/**
 * The to-do sheets, wired together: the task sheet (add or edit), and when "An order" is
 * picked, the order sheet with the name filled in. A task turned into an order is replaced
 * in one step. Used on Today and on "Your orders and to-dos".
 */
export function TaskSheets({ target, onClose, tasks, ownOrders, canAddOrder }: TaskSheetsProps) {
  const [orderStep, setOrderStep] = useState<OrderStep | null>(null);
  const editing = target?.type === 'edit' ? target.item : null;
  // A new key per opening resets the sheet's fields to what it opens on.
  const sheetKey = editing ? `edit-${editing.task.id}` : 'add';

  return (
    <>
      <TaskSheet
        key={sheetKey}
        visible={target != null && target.type !== 'order'}
        mode={editing ? 'edit' : 'add'}
        initialTitle={editing?.task.title}
        initialWhen={
          editing
            ? editing.task.repeat === 'daily'
              ? 'daily'
              : editing.task.day > tasks.today
                ? 'tomorrow'
                : 'today'
            : 'today'
        }
        canMakeOrder={canAddOrder}
        maxOrders={CUSTOM_ORDER_LIMITS.maxActive}
        onClose={onClose}
        onSave={(title, when) =>
          editing ? tasks.change(editing.task.id, title, when) : tasks.add(title, when)
        }
        onChooseOrder={(name) => {
          setOrderStep({ name, fromTaskId: editing?.task.id ?? null, key: Date.now() });
          onClose();
        }}
        onRemove={
          editing
            ? () => {
                tasks.remove(editing.task.id);
                onClose();
              }
            : undefined
        }
      />
      <AddOrderSheet
        key={orderStep?.key ?? 'order'}
        visible={orderStep != null || target?.type === 'order'}
        initialName={orderStep?.name}
        onClose={() => {
          setOrderStep(null);
          if (target?.type === 'order') onClose();
        }}
        onSave={(draft) => {
          const fromTaskId = orderStep?.fromTaskId ?? null;
          const result = fromTaskId != null ? ownOrders.convertTask(fromTaskId, draft) : ownOrders.add(draft);
          if (result === null) {
            setOrderStep(null);
            if (target?.type === 'order') onClose();
          }
          return result;
        }}
      />
    </>
  );
}
