import { addDays, type DayKey } from '@/lib/dates';

/**
 * The to-do list: tasks never affect sealing, the campaign, ranks, denarii or Truces.
 * daily: every day from its first day to its last (the arc's last day, or until removed).
 * once: one day; left unfinished, it waits for "carry over or drop". See docs/ORDERS-AND-TASKS.md.
 */
export type TaskRepeat = 'daily' | 'once';

export type Task = {
  id: number;
  title: string;
  repeat: TaskRepeat;
  /** once: the task's day. daily: the first day it shows. */
  day: DayKey;
  /** daily: the last day it shows. Null for once tasks. */
  lastDay: DayKey | null;
  /** once: the day it was first planned for, if it was carried over. */
  carriedFrom: DayKey | null;
  /** once: dropped from an earlier day instead of carried over. */
  isDropped: boolean;
};

export const TASK_LIMITS = {
  titleMaxLength: 60,
  /** Daily tasks showing on one day. */
  maxDaily: 10,
  /** Day tasks planned for one day. */
  maxPerDay: 20,
} as const;

/** When a new task is for: every day of the arc, today, or tomorrow. */
export type TaskWhen = 'daily' | 'today' | 'tomorrow';

export type TaskError = 'titleMissing' | 'tooMany';

/** Whether a task shows on a day. Day keys sort as text. */
export function isTaskOnDay(task: Task, day: DayKey): boolean {
  if (task.repeat === 'daily') return task.day <= day && (task.lastDay == null || day <= task.lastDay);
  return task.day === day && !task.isDropped;
}

/** A task title tidied for saving: trimmed, single spaces, cut to length. */
export function normalizeTaskTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').slice(0, TASK_LIMITS.titleMaxLength);
}

/** The first problem with a new task, or null if it can be saved. */
export function validateNewTask(
  title: string,
  when: TaskWhen,
  tasks: readonly Task[],
  today: DayKey,
): TaskError | null {
  if (normalizeTaskTitle(title).length === 0) return 'titleMissing';
  if (when === 'daily') {
    const dailyToday = tasks.filter((task) => task.repeat === 'daily' && isTaskOnDay(task, today));
    return dailyToday.length >= TASK_LIMITS.maxDaily ? 'tooMany' : null;
  }
  const day = when === 'today' ? today : addDays(today, 1);
  const onDay = tasks.filter((task) => task.repeat === 'once' && isTaskOnDay(task, day));
  return onDay.length >= TASK_LIMITS.maxPerDay ? 'tooMany' : null;
}

/** The key of a task's tick on a day, for completion lookups. */
export function completionKey(taskId: number, day: DayKey): string {
  return `${taskId}|${day}`;
}

/**
 * Day tasks left unfinished on an earlier day and not yet carried over or dropped,
 * oldest first. These wait for the user's choice.
 */
export function findCarryOver(
  tasks: readonly Task[],
  completions: ReadonlySet<string>,
  today: DayKey,
): Task[] {
  return tasks
    .filter(
      (task) =>
        task.repeat === 'once' &&
        !task.isDropped &&
        task.day < today &&
        !completions.has(completionKey(task.id, task.day)),
    )
    .sort((a, b) => (a.day === b.day ? a.id - b.id : a.day < b.day ? -1 : 1));
}

export type DayTaskSummary = { done: number; total: number; toCarryOver: number };

/** "2 of 5 done · 1 to carry over" for the Today tile. */
export function summarizeDay(
  tasks: readonly Task[],
  completions: ReadonlySet<string>,
  today: DayKey,
): DayTaskSummary {
  const onDay = tasks.filter((task) => isTaskOnDay(task, today));
  return {
    done: onDay.filter((task) => completions.has(completionKey(task.id, today))).length,
    total: onDay.length,
    toCarryOver: findCarryOver(tasks, completions, today).length,
  };
}
