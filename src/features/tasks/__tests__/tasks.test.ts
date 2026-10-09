import { findCarryOver, isTaskOnDay, summarizeDay, type Task, TASK_LIMITS, validateNewTask } from '..';

const TODAY = '2026-10-14';

function task(overrides: Partial<Task>): Task {
  return {
    id: 1,
    title: 'Task',
    repeat: 'once',
    day: TODAY,
    lastDay: null,
    carriedFrom: null,
    isDropped: false,
    ...overrides,
  };
}

describe('isTaskOnDay', () => {
  it('shows daily tasks between their first and last day', () => {
    const daily = task({ repeat: 'daily', day: '2026-10-12', lastDay: '2026-10-20' });
    expect(isTaskOnDay(daily, '2026-10-11')).toBe(false);
    expect(isTaskOnDay(daily, TODAY)).toBe(true);
    expect(isTaskOnDay(daily, '2026-10-20')).toBe(true);
    expect(isTaskOnDay(daily, '2026-10-21')).toBe(false);
  });

  it('shows a day task on its day only, unless dropped', () => {
    expect(isTaskOnDay(task({}), TODAY)).toBe(true);
    expect(isTaskOnDay(task({}), '2026-10-15')).toBe(false);
    expect(isTaskOnDay(task({ isDropped: true }), TODAY)).toBe(false);
  });
});

describe('validateNewTask', () => {
  it('needs a title and respects the limits', () => {
    expect(validateNewTask('  ', 'today', [], TODAY)).toBe('titleMissing');
    expect(validateNewTask('Read', 'today', [], TODAY)).toBeNull();
    const full = Array.from({ length: TASK_LIMITS.maxPerDay }, (_, index) =>
      task({ id: index, day: '2026-10-15' }),
    );
    expect(validateNewTask('Read', 'tomorrow', full, TODAY)).toBe('tooMany');
    expect(validateNewTask('Read', 'today', full, TODAY)).toBeNull();
  });
});

describe('carry-over and summary', () => {
  const tasks = [
    task({ id: 1, day: '2026-10-12' }),
    task({ id: 2, day: '2026-10-13' }),
    task({ id: 3, day: '2026-10-13', isDropped: true }),
    task({ id: 4 }),
    task({ id: 5, repeat: 'daily', day: '2026-10-01', lastDay: '2026-11-01' }),
  ];
  const completions = new Set(['2|2026-10-13', '4|2026-10-14']);

  it('waits on unfinished, undropped day tasks from earlier days', () => {
    expect(findCarryOver(tasks, completions, TODAY).map((item) => item.id)).toEqual([1]);
  });

  it('summarises today for the tile', () => {
    expect(summarizeDay(tasks, completions, TODAY)).toEqual({ done: 1, total: 2, toCarryOver: 1 });
  });
});
