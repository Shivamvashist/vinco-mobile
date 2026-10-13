import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';

import {
  addTask,
  changeTask,
  db,
  removeTask,
  resolveCarryOver,
  selectTaskCompletionsBetween,
  selectTasksAround,
  setTaskDone,
  TaskSaveError,
  toCompletionSet,
  toTask,
} from '@/db';
import {
  completionKey,
  type DayTaskSummary,
  findCarryOver,
  isTaskOnDay,
  sortDoneLast,
  summarizeDay,
  type Task,
  type TaskError,
  type TaskWhen,
} from '@/features/tasks';
import { addDays, type DayKey } from '@/lib/dates';

import { useToday } from './useToday';

export type TaskItem = { task: Task; isDone: boolean };

export type Tasks = {
  today: DayKey;
  isLoaded: boolean;
  daily: TaskItem[];
  /** Day tasks for today, ones moved on from earlier days included. */
  todayTasks: TaskItem[];
  tomorrowTasks: TaskItem[];

  summary: DayTaskSummary;
  /** True when the last change could not be saved. Cleared by the next successful one. */
  hasSaveError: boolean;
  /** Adds a task. Returns null when saved, or why it was refused. */
  add: (title: string, when: TaskWhen) => TaskError | 'failed' | null;
  /** Renames a task or changes how often it comes. Returns null when saved, or why not. */
  change: (taskId: number, title: string, when: TaskWhen) => TaskError | 'failed' | null;
  /** Ticks or unticks a task for today (tomorrow's tasks can't be ticked yet). */
  toggle: (item: TaskItem) => void;
  remove: (taskId: number) => void;
};

/**
 * The to-do list around today, read live from SQLite. Tasks never affect sealing.
 * @param arcLastDay where daily tasks end (the arc's last day)
 */
export function useTasks(arcLastDay: DayKey | null): Tasks {
  const today = useToday();
  const tomorrow = addDays(today, 1);
  const taskRows = useLiveQuery(selectTasksAround(db, today), [today]);
  // Finished past tasks are already left out by the task query, so ticks for today and
  // tomorrow are all that's needed.
  const completionRows = useLiveQuery(selectTaskCompletionsBetween(db, today, tomorrow), [today]);
  const [hasSaveError, setHasSaveError] = useState(false);

  const tasks = taskRows.data.map(toTask).sort((a, b) => a.id - b.id);
  const completions = toCompletionSet(completionRows.data);
  const leftoverIds = findCarryOver(tasks, completions, today)
    .map((task) => task.id)
    .join(',');

  // A day task left undone moves on to today by itself (it keeps where it came from).
  useEffect(() => {
    if (leftoverIds === '') return;
    try {
      resolveCarryOver(db, leftoverIds.split(',').map(Number), 'carry', today);
    } catch (error) {
      if (__DEV__) console.warn('[tasks] Could not carry tasks over.', error);
    }
  }, [leftoverIds, today]);
  // Done tasks sink to the bottom of each list.
  const itemsOn = (day: DayKey, repeat: Task['repeat']): TaskItem[] =>
    sortDoneLast(
      tasks
        .filter((task) => task.repeat === repeat && isTaskOnDay(task, day))
        .map((task) => ({ task, isDone: completions.has(completionKey(task.id, day)) })),
    );

  const guard = (label: string, action: () => void) => {
    try {
      action();
      setHasSaveError(false);
    } catch (error) {
      if (__DEV__) console.warn(`[tasks] Could not ${label}.`, error);
      setHasSaveError(true);
    }
  };

  return {
    today,
    isLoaded: taskRows.updatedAt !== undefined && completionRows.updatedAt !== undefined,
    daily: itemsOn(today, 'daily'),
    todayTasks: itemsOn(today, 'once'),
    tomorrowTasks: itemsOn(tomorrow, 'once'),
    summary: summarizeDay(tasks, completions, today),
    hasSaveError,
    add: (title, when) =>
      saveTask(
        () => addTask(db, title, when, today, arcLastDay ?? today),
        () => setHasSaveError(false),
      ),
    change: (taskId, title, when) =>
      saveTask(
        () => changeTask(db, taskId, title, when, today, arcLastDay ?? today),
        () => setHasSaveError(false),
      ),
    toggle: (item) => {
      if (item.task.day > today && item.task.repeat === 'once') return;
      guard('tick', () => setTaskDone(db, item.task.id, today, !item.isDone));
    },
    remove: (taskId) => guard('remove', () => removeTask(db, taskId, today)),
  };
}

/** Runs a task write, turning a refusal into its reason. */
function saveTask(write: () => void, onSaved: () => void): TaskError | 'failed' | null {
  try {
    write();
    onSaved();
    return null;
  } catch (error) {
    if (error instanceof TaskSaveError) return error.reason;
    if (__DEV__) console.warn('[tasks] Could not save.', error);
    return 'failed';
  }
}
