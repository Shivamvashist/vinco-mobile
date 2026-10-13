import { View } from 'react-native';

import { pickTone, tasksCopy } from '@/copy';
import { type TaskItem, type Tasks } from '@/hooks/useTasks';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { SectionHeader } from '../SectionHeader';
import { CarryOverCard } from '../tasks/CarryOverCard';
import { TaskItemRow } from '../tasks/TaskItemRow';
import { ToneLine } from '../ToneLine';
import { Txt } from '../Txt';

export type TodoPanelProps = {
  tasks: Tasks;
  onAdd: () => void;
  onEdit: (item: TaskItem) => void;
};

/**
 * The whole to-do list: carry-over, every day, today, tomorrow. Tap to tick, the cross to
 * remove, press and hold to edit (rename, how often, make it an order). Never affects sealing.
 */
export function TodoPanel({ tasks, onAdd, onEdit }: TodoPanelProps) {
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);
  const isEmpty =
    tasks.daily.length + tasks.todayTasks.length + tasks.tomorrowTasks.length + tasks.carryOver.length === 0;

  const renderItems = (items: readonly TaskItem[], kind: 'daily' | 'today' | 'tomorrow') =>
    items.map((item) => (
      <TaskItemRow
        key={item.task.id}
        title={item.task.title}
        isDone={item.isDone}
        note={
          kind === 'tomorrow'
            ? tasksCopy.tomorrowHint
            : item.task.carriedFrom
              ? tasksCopy.carriedOver
              : undefined
        }
        canTick={kind !== 'tomorrow'}
        onToggle={() => tasks.toggle(item)}
        onRemove={() => tasks.remove(item.task.id)}
        onEdit={() => onEdit(item)}
      />
    ));

  return (
    <View>
      <Txt variant="caption" style={styles.intro}>
        {tasksCopy.intro}
      </Txt>
      {isEmpty ? null : (
        <Txt variant="micro" style={styles.intro}>
          {tasksCopy.edit.hint}
        </Txt>
      )}

      {tasks.hasSaveError ? (
        <Card variant="sunk" style={styles.block} accessibilityRole="alert">
          <Txt variant="caption" color="danger">
            {tasksCopy.saveError}
          </Txt>
        </Card>
      ) : null}

      {tasks.carryOver.length > 0 ? (
        <View style={styles.block}>
          <CarryOverCard tasks={tasks.carryOver} today={tasks.today} onResolve={tasks.resolve} />
        </View>
      ) : null}

      {tasks.isLoaded && isEmpty ? (
        <View style={styles.block}>
          <ToneLine line={pickTone(tasksCopy.emptyLine, tone)} tone={tone} />
        </View>
      ) : null}

      {tasks.daily.length > 0 ? (
        <>
          <SectionHeader title={tasksCopy.sections.daily} />
          <View style={styles.list}>{renderItems(tasks.daily, 'daily')}</View>
        </>
      ) : null}
      {tasks.todayTasks.length > 0 ? (
        <>
          <SectionHeader title={tasksCopy.sections.today} />
          <View style={styles.list}>{renderItems(tasks.todayTasks, 'today')}</View>
        </>
      ) : null}
      {tasks.tomorrowTasks.length > 0 ? (
        <>
          <SectionHeader title={tasksCopy.sections.tomorrow} />
          <View style={styles.list}>{renderItems(tasks.tomorrowTasks, 'tomorrow')}</View>
        </>
      ) : null}

      <View style={styles.add}>
        <Button label={tasksCopy.today.add} variant="secondary" onPress={onAdd} />
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  intro: { marginTop: theme.space.sm },
  block: { marginTop: theme.space.lg },
  list: { gap: theme.space.sm },
  add: { marginTop: theme.space.xxl, marginBottom: theme.space.lg },
}));
