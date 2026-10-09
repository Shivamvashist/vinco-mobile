import { and, eq, gte, inArray, isNull, lt, lte, notExists, or } from 'drizzle-orm';

import { addDays, type DayKey } from '@/lib/dates';
import {
  completionKey,
  findCarryOver,
  normalizeTaskTitle,
  type Task,
  type TaskError,
  type TaskWhen,
  validateNewTask,
} from '@/features/tasks';

import { type AppDatabase, nowIso } from './database';
import { taskCompletions, type TaskCompletionRow, type TaskRow, tasks } from './schema';

/**
 * The query for every task that matters around today: daily tasks still running, day tasks
 * for today and tomorrow, and unfinished day tasks from earlier days (waiting for carry
 * over or drop). Finished past tasks stay in the table but aren't read. Pass to useLiveQuery.
 */
export function selectTasksAround(db: AppDatabase, today: DayKey) {
  const tomorrow = addDays(today, 1);
  const isUnfinishedOnItsDay = notExists(
    db
      .select({ taskId: taskCompletions.taskId })
      .from(taskCompletions)
      .where(and(eq(taskCompletions.taskId, tasks.id), eq(taskCompletions.day, tasks.day))),
  );
  return db
    .select()
    .from(tasks)
    .where(
      or(
        and(
          eq(tasks.repeat, 'daily'),
          lte(tasks.day, tomorrow),
          or(isNull(tasks.lastDay), gte(tasks.lastDay, today)),
        ),
        and(
          eq(tasks.repeat, 'once'),
          eq(tasks.isDropped, false),
          or(
            and(gte(tasks.day, today), lte(tasks.day, tomorrow)),
            and(lt(tasks.day, today), isUnfinishedOnItsDay),
          ),
        ),
      ),
    );
}

/** The query for task ticks between two days. Pass to useLiveQuery. */
export function selectTaskCompletionsBetween(db: AppDatabase, from: DayKey, to: DayKey) {
  return db
    .select()
    .from(taskCompletions)
    .where(and(gte(taskCompletions.day, from), lte(taskCompletions.day, to)));
}

/** A row as the feature type. Unknown repeat values are read as day tasks. */
export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    repeat: row.repeat === 'daily' ? 'daily' : 'once',
    day: row.day,
    lastDay: row.lastDay,
    carriedFrom: row.carriedFrom,
    isDropped: row.isDropped,
  };
}

/** Tick rows as a set of completion keys. */
export function toCompletionSet(rows: readonly TaskCompletionRow[]): Set<string> {
  return new Set(rows.map((row) => completionKey(row.taskId, row.day)));
}

/** Why a task could not be added. */
export class TaskSaveError extends Error {
  readonly reason: TaskError;

  constructor(reason: TaskError) {
    super(`Task refused: ${reason}`);
    this.name = 'TaskSaveError';
    this.reason = reason;
  }
}

/**
 * Adds a task. Daily tasks run from today to the arc's last day; day tasks are for today
 * or tomorrow. Validated inside the transaction. Throws TaskSaveError if refused.
 */
export function addTask(
  db: AppDatabase,
  title: string,
  when: TaskWhen,
  today: DayKey,
  arcLastDay: DayKey,
): number {
  return db.transaction((tx) => {
    const current = selectTasksAround(tx, today).all().map(toTask);
    const error = validateNewTask(title, when, current, today);
    if (error) throw new TaskSaveError(error);
    const isDaily = when === 'daily';
    return tx
      .insert(tasks)
      .values({
        title: normalizeTaskTitle(title),
        repeat: isDaily ? 'daily' : 'once',
        day: when === 'tomorrow' ? addDays(today, 1) : today,
        // A daily task never runs past the arc, and always shows at least today.
        lastDay: isDaily ? (arcLastDay < today ? today : arcLastDay) : null,
        createdAt: nowIso(),
      })
      .returning({ id: tasks.id })
      .get().id;
  });
}

/** Ticks or unticks a task on a day. */
export function setTaskDone(db: AppDatabase, taskId: number, day: DayKey, isDone: boolean): void {
  if (isDone) {
    db.insert(taskCompletions).values({ taskId, day, doneAt: nowIso() }).onConflictDoNothing().run();
  } else {
    db.delete(taskCompletions)
      .where(and(eq(taskCompletions.taskId, taskId), eq(taskCompletions.day, day)))
      .run();
  }
}

/**
 * Removes a task from today on. A daily task added before today keeps its past ticks and
 * stops yesterday; anything else is deleted with its ticks.
 */
export function removeTask(db: AppDatabase, taskId: number, today: DayKey): void {
  db.transaction((tx) => {
    const row = tx.select().from(tasks).where(eq(tasks.id, taskId)).get();
    if (!row) return;
    if (row.repeat === 'daily' && row.day < today) {
      tx.delete(taskCompletions)
        .where(and(eq(taskCompletions.taskId, taskId), gte(taskCompletions.day, today)))
        .run();
      tx.update(tasks)
        .set({ lastDay: addDays(today, -1) })
        .where(eq(tasks.id, taskId))
        .run();
      return;
    }
    tx.delete(taskCompletions).where(eq(taskCompletions.taskId, taskId)).run();
    tx.delete(tasks).where(eq(tasks.id, taskId)).run();
  });
}

/**
 * Carries unfinished day tasks from earlier days over to today, or drops them. Only tasks
 * still waiting for that choice are touched, so a double tap does nothing twice.
 */
export function resolveCarryOver(
  db: AppDatabase,
  taskIds: readonly number[],
  choice: 'carry' | 'drop',
  today: DayKey,
): void {
  if (taskIds.length === 0) return;
  db.transaction((tx) => {
    const rows = tx
      .select()
      .from(tasks)
      .where(inArray(tasks.id, [...taskIds]))
      .all();
    const completions = toCompletionSet(
      tx
        .select()
        .from(taskCompletions)
        .where(inArray(taskCompletions.taskId, [...taskIds]))
        .all(),
    );
    for (const task of findCarryOver(rows.map(toTask), completions, today)) {
      if (choice === 'drop') {
        tx.update(tasks).set({ isDropped: true }).where(eq(tasks.id, task.id)).run();
      } else {
        tx.update(tasks)
          .set({ day: today, carriedFrom: task.carriedFrom ?? task.day })
          .where(eq(tasks.id, task.id))
          .run();
      }
    }
  });
}
