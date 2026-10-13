import { DEFAULT_ORDER_TARGETS } from '@/features/orders';
import { TASK_LIMITS } from '@/features/tasks';

import { FEATURES } from '@/config/features';

import { createArc } from '../arcs';
import { convertTaskToOrder, CustomOrderError, selectCustomOrdersOn } from '../customOrders';
import {
  addTask,
  changeTask,
  removeTask,
  resolveCarryOver,
  selectTaskCompletionsBetween,
  selectTasksAround,
  setTaskDone,
  TaskSaveError,
  toTask,
} from '../tasks';
import { createTestDatabase } from '../testing/testDatabase';

const TODAY = '2026-10-14';
const ARC_END = '2026-11-10';

function tasksAround(db: ReturnType<typeof createTestDatabase>, today = TODAY) {
  return selectTasksAround(db, today).all().map(toTask);
}

describe('tasks', () => {
  it('adds daily tasks to the arc end, and day tasks for today or tomorrow', () => {
    const db = createTestDatabase();
    addTask(db, ' Stretch  10 min ', 'daily', TODAY, ARC_END);
    addTask(db, 'Call the bank', 'today', TODAY, ARC_END);
    addTask(db, 'Buy oats', 'tomorrow', TODAY, ARC_END);
    expect(tasksAround(db).map((task) => [task.title, task.repeat, task.day, task.lastDay])).toEqual([
      ['Stretch 10 min', 'daily', TODAY, ARC_END],
      ['Call the bank', 'once', TODAY, null],
      ['Buy oats', 'once', '2026-10-15', null],
    ]);
  });

  it('refuses empty titles and too many daily tasks', () => {
    const db = createTestDatabase();
    expect(() => addTask(db, '   ', 'today', TODAY, ARC_END)).toThrow(TaskSaveError);
    for (let index = 0; index < TASK_LIMITS.maxDaily; index += 1) {
      addTask(db, `Task ${index}`, 'daily', TODAY, ARC_END);
    }
    expect(() => addTask(db, 'One more', 'daily', TODAY, ARC_END)).toThrow(TaskSaveError);
  });

  it('ticks once per day and unticks cleanly', () => {
    const db = createTestDatabase();
    const id = addTask(db, 'Stretch', 'daily', TODAY, ARC_END);
    setTaskDone(db, id, TODAY, true);
    setTaskDone(db, id, TODAY, true);
    expect(selectTaskCompletionsBetween(db, TODAY, TODAY).all()).toHaveLength(1);
    setTaskDone(db, id, TODAY, false);
    expect(selectTaskCompletionsBetween(db, TODAY, TODAY).all()).toHaveLength(0);
  });

  it('removes a running daily task from today on, keeping past ticks', () => {
    const db = createTestDatabase();
    const id = addTask(db, 'Stretch', 'daily', '2026-10-12', ARC_END);
    setTaskDone(db, id, '2026-10-13', true);
    removeTask(db, id, TODAY);
    expect(tasksAround(db)).toEqual([]);
    expect(selectTaskCompletionsBetween(db, '2026-10-13', '2026-10-13').all()).toHaveLength(1);
  });

  it('carries over or drops unfinished day tasks, only once', () => {
    const db = createTestDatabase();
    const done = addTask(db, 'Done one', 'today', '2026-10-12', ARC_END);
    const carry = addTask(db, 'Carry me', 'today', '2026-10-12', ARC_END);
    const drop = addTask(db, 'Drop me', 'today', '2026-10-13', ARC_END);
    setTaskDone(db, done, '2026-10-12', true);

    // A finished past task is not read; unfinished ones wait for a choice.
    expect(tasksAround(db).map((task) => task.title)).toEqual(['Carry me', 'Drop me']);

    resolveCarryOver(db, [carry], 'carry', TODAY);
    resolveCarryOver(db, [drop], 'drop', TODAY);
    // Already carried to today: a second carry does nothing.
    resolveCarryOver(db, [carry], 'carry', TODAY);
    expect(tasksAround(db)).toEqual([
      expect.objectContaining({ title: 'Carry me', day: TODAY, carriedFrom: '2026-10-12' }),
    ]);
  });
});

describe('changing a task', () => {
  it('renames it and makes it daily, keeping the tick for today', () => {
    const db = createTestDatabase();
    const id = addTask(db, 'Stretch', 'today', TODAY, ARC_END);
    setTaskDone(db, id, TODAY, true);
    const next = changeTask(db, id, 'Stretch well', 'daily', TODAY, ARC_END);
    const [task] = tasksAround(db);
    expect(task).toMatchObject({ id: next, title: 'Stretch well', repeat: 'daily', lastDay: ARC_END });
    expect(
      selectTaskCompletionsBetween(db, TODAY, TODAY)
        .all()
        .map((row) => row.taskId),
    ).toEqual([next]);
  });

  it('moves it to tomorrow, leaving the tick for today behind', () => {
    const db = createTestDatabase();
    const id = addTask(db, 'Buy oats', 'today', TODAY, ARC_END);
    setTaskDone(db, id, TODAY, true);
    changeTask(db, id, 'Buy oats', 'tomorrow', TODAY, ARC_END);
    expect(tasksAround(db).map((task) => task.day)).toEqual(['2026-10-15']);
    expect(selectTaskCompletionsBetween(db, TODAY, '2026-10-15').all()).toHaveLength(0);
  });

  it('changes nothing when refused', () => {
    const db = createTestDatabase();
    const id = addTask(db, 'Stretch', 'today', TODAY, ARC_END);
    expect(() => changeTask(db, id, '   ', 'daily', TODAY, ARC_END)).toThrow(TaskSaveError);
    expect(tasksAround(db).map((task) => task.title)).toEqual(['Stretch']);
  });
});

describe('turning a task into an order', () => {
  beforeEach(() => jest.replaceProperty(FEATURES, 'customOrders', true));
  afterEach(() => jest.restoreAllMocks());

  const startArc = (db: ReturnType<typeof createTestDatabase>) =>
    createArc(db, {
      lengthDays: 30,
      startDay: TODAY,
      wakeTime: '06:30',
      targets: DEFAULT_ORDER_TARGETS,
      oathPath: null,
    });

  it('adds the order and removes the task together', () => {
    const db = createTestDatabase();
    const arcId = startArc(db);
    const id = addTask(db, 'Read', 'today', TODAY, ARC_END);
    convertTaskToOrder(db, id, arcId, { name: 'Read', unit: 'pages', min: 10, full: 30 }, TODAY);
    expect(tasksAround(db)).toHaveLength(0);
    expect(
      selectCustomOrdersOn(db, arcId, TODAY)
        .all()
        .map((order) => order.name),
    ).toEqual(['Read']);
  });

  it('keeps the task when the order is refused', () => {
    const db = createTestDatabase();
    const arcId = startArc(db);
    const id = addTask(db, 'Read', 'today', TODAY, ARC_END);
    expect(() =>
      convertTaskToOrder(db, id, arcId, { name: 'Read', unit: '', min: 30, full: 10 }, TODAY),
    ).toThrow(CustomOrderError);
    expect(tasksAround(db)).toHaveLength(1);
  });
});
