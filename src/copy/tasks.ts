import type { TaskError, TaskWhen } from '@/features/tasks';

import type { ToneLines } from './toneLines';

/** The to-do list. Tasks never affect sealing; orders do. Rules in docs/ORDERS-AND-TASKS.md. */
export const tasksCopy = {
  eyebrow: 'To-do',
  title: 'Your plan',
  intro: 'Tasks help plan the day. They never decide it: your orders do.',
  back: 'Back',

  sections: {
    daily: 'Every day',
    today: 'Today',
    tomorrow: 'Tomorrow',
  },
  carriedOver: 'carried over',
  remove: (title: string): string => `Remove ${title}`,
  checkLabel: (title: string, isDone: boolean): string => `${title}, ${isDone ? 'done' : 'not done'}`,
  tomorrowHint: 'Planned for tomorrow',

  /** Shown when nothing is planned. */
  emptyLine: {
    philosopher: 'Nothing planned. A short list, kept, is worth more than a long one.',
    centurion: 'No tasks on the board. Add one and see it through.',
    roast: 'Your to-do list is emptier than your excuses are creative. Add one thing. Just one.',
  } satisfies ToneLines,

  carryOver: {
    title: (count: number): string =>
      count === 1 ? '1 task left unfinished' : `${count} tasks left unfinished`,
    body: 'Carry them over to today, or drop them. Nothing moves without your say.',
    from: (dayLabel: string): string => `From ${dayLabel}`,
    carry: 'Carry over',
    drop: 'Drop',
    carryAll: 'Carry all over',
    dropAll: 'Drop all',
  },

  add: {
    open: 'Add a task',
    title: 'Add a task',
    label: 'Task',
    placeholder: 'Call the bank',
    whenLabel: 'When',
    when: {
      daily: 'Every day',
      today: 'Today',
      tomorrow: 'Tomorrow',
    } satisfies Record<TaskWhen, string>,
    whenHint: {
      daily: 'Shows every day until your arc ends. Not an order: it never decides the day.',
      today: 'Just for today.',
      tomorrow: 'Plan ahead: it shows up tomorrow.',
    } satisfies Record<TaskWhen, string>,
    save: 'Add task',
    /** The sheet stays open after each save, for adding several in a row. */
    done: 'Done',
    errors: {
      titleMissing: 'Write the task first.',
      tooMany: 'That list is full. Finish or remove one first.',
    } satisfies Record<TaskError, string>,
    failed: "The task couldn't be saved. Try again.",
  },
  saveError: 'That change could not be saved. Try again.',
} as const;
