import { View } from 'react-native';

import { tasksCopy } from '@/copy';
import type { TaskItem, Tasks } from '@/hooks/useTasks';
import { createStyles, useFeedback } from '@/theme';

import { Button } from '../Button';
import { SectionHeader } from '../SectionHeader';
import { TaskItemRow } from '../tasks/TaskItemRow';
import { Txt } from '../Txt';

/** Today keeps the list short; the rest is one tap away. */
const MAX_SHOWN = 5;

export type TodayTodoProps = {
  tasks: Tasks;
  onAdd: () => void;
  onEdit: (item: TaskItem) => void;
  /** Opens the full list ("Your orders and to-dos", To-do). */
  onOpenAll: () => void;
};

const copy = tasksCopy.today;

/**
 * The to-do on Today: open tasks first, done ones sink. One tap to tick, a long press to edit.
 * A day task left undone moves to the next day by itself. Never affects sealing.
 */
export function TodayTodo({ tasks, onAdd, onEdit, onOpenAll }: TodayTodoProps) {
  const styles = useStyles();
  const play = useFeedback();
  // Open tasks first (every day, then today), done ones at the bottom.
  const items = [...tasks.daily, ...tasks.todayTasks].sort((a, b) => Number(a.isDone) - Number(b.isDone));
  const shown = items.slice(0, MAX_SHOWN);
  const hiddenCount = items.length - shown.length + tasks.tomorrowTasks.length;

  return (
    <>
      <SectionHeader title={copy.section} />
      <View style={styles.list}>
        {items.length === 0 ? <Txt variant="caption">{copy.empty}</Txt> : null}
        {shown.map((item) => (
          <TaskItemRow
            key={item.task.id}
            title={item.task.title}
            isDone={item.isDone}
            note={
              item.task.repeat === 'daily'
                ? tasksCopy.sections.daily
                : item.task.carriedFrom
                  ? tasksCopy.carriedOver
                  : undefined
            }
            canTick
            onToggle={() => {
              play(item.isDone ? 'stepDown' : 'tap');
              tasks.toggle(item);
            }}
            onEdit={() => onEdit(item)}
          />
        ))}
        <View style={styles.actions}>
          <Button label={copy.add} variant="ghost" size="compact" onPress={onAdd} />
          {hiddenCount > 0 ? (
            <Button
              label={copy.seeAll(items.length + tasks.tomorrowTasks.length)}
              variant="ghost"
              size="compact"
              onPress={onOpenAll}
            />
          ) : items.length > 0 ? (
            <Button label={copy.manage} variant="ghost" size="compact" onPress={onOpenAll} />
          ) : null}
        </View>
      </View>
    </>
  );
}

const useStyles = createStyles((theme) => ({
  list: { gap: theme.space.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
}));
