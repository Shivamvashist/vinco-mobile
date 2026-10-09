import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { AddTaskSheet } from '@/components/tasks/AddTaskSheet';
import { CarryOverCard } from '@/components/tasks/CarryOverCard';
import { TaskItemRow } from '@/components/tasks/TaskItemRow';
import { ToneLine } from '@/components/ToneLine';
import { Txt } from '@/components/Txt';
import { commonCopy, pickTone, tasksCopy } from '@/copy';
import { arcEndDay } from '@/features/arc';
import { useActiveArc } from '@/hooks/useActiveArc';
import { type TaskItem, useTasks } from '@/hooks/useTasks';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

/**
 * The to-do list: daily tasks (every day of the arc) and day tasks (today, tomorrow).
 * Tasks never decide the day; orders do. See docs/ORDERS-AND-TASKS.md.
 */
export default function TasksScreen() {
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);
  const { arc } = useActiveArc();
  const tasks = useTasks(arc ? arcEndDay(arc.startDay, arc.lengthDays) : null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const isEmpty =
    tasks.daily.length + tasks.todayTasks.length + tasks.tomorrowTasks.length + tasks.carryOver.length === 0;

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

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
      />
    ));

  return (
    <>
      <Screen gutter="flow" edges={['top', 'bottom']}>
        <View style={styles.nav}>
          <IconButton icon="back" accessibilityLabel={tasksCopy.back} onPress={back} />
        </View>
        <ScreenHeader
          eyebrow={tasksCopy.eyebrow}
          title={tasksCopy.title}
          caption={commonCopy.fullDateLabel(tasks.today)}
        />
        <Txt variant="caption" style={styles.intro}>
          {tasksCopy.intro}
        </Txt>

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
          <Button label={tasksCopy.add.open} variant="secondary" onPress={() => setIsAddOpen(true)} />
        </View>
      </Screen>

      <AddTaskSheet visible={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={tasks.add} />
    </>
  );
}

const useStyles = createStyles((theme) => ({
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: theme.space.sm },
  intro: { marginTop: theme.space.sm },
  block: { marginTop: theme.space.lg },
  list: { gap: theme.space.sm },
  add: { marginTop: theme.space.xxl, marginBottom: theme.space.lg },
}));
