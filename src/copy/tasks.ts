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

  add: {
    open: 'Add a task',
    title: 'Add to your day',
    label: 'What',
    placeholder: 'Call the bank',
    whenLabel: 'How often?',
    when: {
      today: 'Just today',
      tomorrow: 'Tomorrow',
      daily: 'Every day',
      order: 'An order',
    } satisfies Record<TaskWhen | 'order', string>,
    whenHint: {
      daily:
        'Shows every day until your campaign ends (in free training, until you remove it). A plan, not an order: it never decides the day.',
      today: 'Just for today. Not done by midnight? It moves to tomorrow by itself.',
      tomorrow: 'Plan ahead: it shows up tomorrow, and keeps moving on until done.',
      order: 'Counts toward the day: it must hold its minimum for the day to be held. Next, set its goals.',
    } satisfies Record<TaskWhen | 'order', string>,
    orderFull: (max: number): string => `You already have ${max} own orders. Stand one down to add another.`,
    next: 'Next: set its goals',
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

  /** Long-press (or the edit button) on a task. */
  edit: {
    title: 'Edit task',
    hint: 'Press and hold a task to edit it',
    open: (title: string): string => `Edit ${title}`,
    save: 'Save',
    remove: 'Remove task',
    makeOrder: 'Next: make it an order',
  },

  /** "Your orders and to-dos": one place to control everything the day holds. */
  plan: {
    eyebrow: 'Your plan',
    title: 'Orders and to-dos',
    segments: { orders: 'Orders', todo: 'To-do' },
    back: 'Back',
  },

  /** The to-do section on Today. */
  today: {
    section: 'To-do',
    add: 'Add to your day',
    seeAll: (count: number): string => `See all (${count})`,
    manage: 'Manage',
    empty: 'Nothing planned. Add one thing you want done today.',
  },
} as const;
