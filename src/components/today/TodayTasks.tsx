import { View } from 'react-native';

import { tasksCopy } from '@/copy';
import type { TaskItem, Tasks } from '@/hooks/useTasks';
import { createStyles, useFeedback } from '@/theme';

import { Button } from '../Button';
import { TaskItemRow } from '../tasks/TaskItemRow';
import { Txt } from '../Txt';
import { type DailyLogItem, DailyLogRows } from './DailyLogRows';

/** Today keeps the list short; the rest is one tap away. */
const MAX_SHOWN = 5;

export type TodayTasksProps = {
  /** Today's to-dos, or null when the to-do is switched off or not read yet. */
  tasks: Tasks | null;
  /** The selfie, weight and calories rows. */
  logs: readonly DailyLogItem[];
  onAdd: () => void;
  onEdit: (item: TaskItem) => void;
  /** Opens the full list ("Your orders and to-dos", To-do). */
  onOpenAll: () => void;
};

const copy = tasksCopy.today;

/**
 * The Tasks side of Today's section: the to-dos (open first, done ones sink; tap to tick, hold to
 * edit), the add and see-all links, then the daily logs. Never affects sealing.
 */
export function TodayTasks({ tasks, logs, onAdd, onEdit, onOpenAll }: TodayTasksProps) {
  const styles = useStyles();
  const play = useFeedback();
  const items = tasks
    ? [...tasks.daily, ...tasks.todayTasks].sort((a, b) => Number(a.isDone) - Number(b.isDone))
    : [];
  const shown = items.slice(0, MAX_SHOWN);
  const allCount = items.length + (tasks?.tomorrowTasks.length ?? 0);

  return (
    <View style={styles.block}>
      {tasks ? (
        <View style={styles.list}>
          {items.length === 0 ? <Txt variant="caption">{copy.empty}</Txt> : null}
          {shown.map((item) => (
            <TaskItemRow
              key={item.task.id}
              title={item.task.title}
              isDone={item.isDone}
              note={item.task.carriedFrom && item.task.repeat !== 'daily' ? tasksCopy.carriedOver : undefined}
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
            {allCount > shown.length ? (
              <Button label={copy.seeAll(allCount)} variant="ghost" size="compact" onPress={onOpenAll} />
            ) : null}
          </View>
        </View>
      ) : null}
      <DailyLogRows items={logs} />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  block: { gap: theme.space.lg },
  list: { gap: theme.space.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
}));
