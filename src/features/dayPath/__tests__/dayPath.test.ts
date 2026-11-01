import {
  clusterPathPoints,
  collectDayActivity,
  type DayActivityInput,
  dayStartMinutes,
  familyOf,
  orderStepKey,
  type PathPoint,
  placeOnPath,
  summariseDayActivity,
  toPathMarks,
} from '..';

const DAY = '2026-11-01';

/** A local moment on the test day ('HH:MM'). */
function at(clock: string, day = DAY): Date {
  const [year, month, date] = day.split('-').map(Number) as [number, number, number];
  const [hours, minutes] = clock.split(':').map(Number) as [number, number];
  return new Date(year, month - 1, date, hours, minutes);
}

function iso(clock: string, day = DAY): string {
  return at(clock, day).toISOString();
}

function input(overrides: Partial<DayActivityInput> = {}): DayActivityInput {
  return {
    day: DAY,
    realDay: DAY,
    now: at('18:00'),
    steps: [],
    orderLogs: [],
    ownOrderLogs: [],
    dayLog: null,
    taskCompletions: [],
    focusSessions: [],
    claims: [],
    truceSpends: [],
    ...overrides,
  };
}

describe('collectDayActivity', () => {
  it('is empty on a day with nothing done', () => {
    expect(collectDayActivity(input())).toEqual([]);
  });

  it('gathers every kind of activity, oldest first', () => {
    const items = collectDayActivity(
      input({
        dayLog: {
          wokeAt: iso('06:20'),
          selfieAt: iso('06:40'),
          weightAt: iso('06:41'),
          caloriesAt: iso('21:00'),
        },
        steps: [
          { id: 1, orderKey: 'water', at: iso('07:00') },
          { id: 2, orderKey: 'water', at: iso('09:00') },
          { id: 3, orderKey: orderStepKey(4), at: iso('12:00') },
        ],
        taskCompletions: [{ taskId: 9, doneAt: iso('10:00') }],
        focusSessions: [
          {
            id: 5,
            startedAt: iso('13:00'),
            endsAt: iso('13:25'),
            endedAt: iso('13:25'),
            status: 'completed',
          },
        ],
        claims: [{ id: 2, claimedAt: iso('14:00') }],
        truceSpends: [{ day: DAY, createdAt: iso('08:00') }],
      }),
    );
    expect(items.map((item) => item.kind)).toEqual([
      'wake',
      'selfie',
      'weight',
      'order',
      'truce',
      'order',
      'task',
      'order',
      'focus',
      'reward',
      'calories',
    ]);
  });

  it('marks wake-up at the wake time, not at its step', () => {
    const items = collectDayActivity(
      input({
        dayLog: { wokeAt: iso('05:50'), selfieAt: null, weightAt: null, caloriesAt: null },
        steps: [{ id: 1, orderKey: 'wake', at: iso('07:30') }],
      }),
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'wake', at: at('05:50') });
  });

  it('falls back to the log time for an order logged before steps were kept', () => {
    const items = collectDayActivity(
      input({
        steps: [{ id: 1, orderKey: 'water', at: iso('09:00') }],
        orderLogs: [
          { kind: 'water', amount: 2, updatedAt: iso('09:00') },
          { kind: 'meal', amount: 1, updatedAt: iso('13:00') },
          { kind: 'workout', amount: 0, updatedAt: iso('15:00') },
        ],
        ownOrderLogs: [{ orderId: 3, amount: 5, updatedAt: iso('16:00') }],
      }),
    );
    expect(items.map((item) => item.id)).toEqual(['step:1', 'log:meal', 'log:own:3']);
  });

  it('skips rows with an unreadable time, and proof logged before times were kept', () => {
    const items = collectDayActivity(
      input({
        dayLog: { wokeAt: 'not a date', selfieAt: null, weightAt: null, caloriesAt: null },
        taskCompletions: [{ taskId: 1, doneAt: '' }],
      }),
    );
    expect(items).toEqual([]);
  });

  it('draws a focus from start to end, and a running one up to now', () => {
    const items = collectDayActivity(
      input({
        now: at('15:10'),
        focusSessions: [
          {
            id: 1,
            startedAt: iso('09:00'),
            endsAt: iso('09:50'),
            endedAt: iso('09:20'),
            status: 'abandoned',
          },
          { id: 2, startedAt: iso('15:00'), endsAt: iso('15:50'), endedAt: null, status: 'running' },
        ],
      }),
    );
    expect(items[0]).toMatchObject({ focus: 'retreated', at: at('09:00'), until: at('09:20') });
    expect(items[1]).toMatchObject({ focus: 'running', at: at('15:00'), until: at('15:10') });
  });

  it('counts a sick day on its day, and a Truce for missed days when called today', () => {
    const items = collectDayActivity(
      input({
        truceSpends: [
          { day: DAY, createdAt: iso('07:00') },
          // One call covering two missed days: one mark.
          { day: '2026-10-30', createdAt: iso('08:00') },
          { day: '2026-10-31', createdAt: iso('08:00') },
          // A sick day called yesterday, for yesterday: not today's.
          { day: '2026-10-31', createdAt: iso('09:00', '2026-10-31') },
        ],
      }),
    );
    expect(items.map((item) => item.kind)).toEqual(['truce', 'truce']);
  });
});

describe('summariseDayActivity', () => {
  it('counts every activity and finds the last, a focus by its end', () => {
    const summary = summariseDayActivity([
      { id: 'a', kind: 'order', at: at('09:00') },
      { id: 'b', kind: 'focus', at: at('15:00'), until: at('16:12'), focus: 'held' },
      { id: 'c', kind: 'task', at: at('16:00') },
    ]);
    expect(summary).toEqual({ count: 3, lastAt: at('16:12') });
  });

  it('has no last time on an empty day', () => {
    expect(summariseDayActivity([])).toEqual({ count: 0, lastAt: null });
  });
});

describe('placeOnPath', () => {
  it('starts at the wake time, else the planned wake, else midnight', () => {
    expect(dayStartMinutes(at('05:45'), 390)).toBe(345);
    expect(dayStartMinutes(null, 390)).toBe(390);
    expect(dayStartMinutes(null, null)).toBe(0);
    expect(dayStartMinutes(new Date(Number.NaN), 390)).toBe(390);
  });

  it('maps the day from its start (0) to midnight (1)', () => {
    expect(placeOnPath(at('06:00'), 360)).toBe(0);
    expect(placeOnPath(at('15:00'), 360)).toBeCloseTo(0.5);
    expect(placeOnPath(at('23:59'), 360)).toBeLessThan(1);
  });

  it('clamps activity before the start (before dawn, after midnight) to the start', () => {
    expect(placeOnPath(at('04:00'), 360)).toBe(0);
    expect(placeOnPath(at('00:20'), 360)).toBe(0);
  });

  it('uses only the time of day, so the dev clock days ahead changes nothing', () => {
    expect(placeOnPath(at('15:00', '2026-11-09'), 360)).toBeCloseTo(placeOnPath(at('15:00'), 360));
  });

  it('copes with a start at the last minute and an invalid date', () => {
    expect(placeOnPath(at('23:59'), 1439)).toBe(0);
    expect(placeOnPath(new Date(Number.NaN), 360)).toBe(0);
  });
});

describe('toPathMarks', () => {
  it('turns moments into points and focus into spans', () => {
    const marks = toPathMarks(
      [
        { id: 'w', kind: 'wake', at: at('06:00') },
        { id: 'f', kind: 'focus', at: at('15:00'), until: at('16:30'), focus: 'held' },
        { id: 'r', kind: 'reward', at: at('15:00') },
      ],
      360,
    );
    expect(marks.points).toEqual([
      { id: 'w', position: 0, family: 'order' },
      { id: 'r', position: 0.5, family: 'log' },
    ]);
    expect(marks.spans).toEqual([{ id: 'f', from: 0.5, to: expect.closeTo(0.5 + 1.5 / 18), style: 'held' }]);
  });

  it('keeps three colour families', () => {
    expect(familyOf('wake')).toBe('order');
    expect(familyOf('focus')).toBe('focus');
    expect(familyOf('truce')).toBe('log');
  });
});

describe('clusterPathPoints', () => {
  const point = (id: string, position: number, family: PathPoint['family'] = 'order'): PathPoint => ({
    id,
    position,
    family,
  });

  it('keeps marks apart when there is room', () => {
    const clusters = clusterPathPoints([point('a', 0.1), point('b', 0.5)], 0.02);
    expect(clusters.map((cluster) => cluster.count)).toEqual([1, 1]);
  });

  it('merges marks too close into one, at their mean, keyed by the first', () => {
    const clusters = clusterPathPoints([point('b', 0.31), point('a', 0.3), point('c', 0.7)], 0.02);
    expect(clusters[0]).toMatchObject({ key: 'a', count: 2, ids: ['a', 'b'] });
    expect(clusters[0]?.position).toBeCloseTo(0.305);
  });

  it('never chains a run of close marks across the path', () => {
    const run = Array.from({ length: 10 }, (_, index) => point(`p${index}`, index * 0.015));
    const clusters = clusterPathPoints(run, 0.02);
    expect(clusters.length).toBeGreaterThan(1);
    expect(clusters.every((cluster) => cluster.count <= 2)).toBe(true);
  });

  it('turns a hundred water taps into a handful of dots', () => {
    const taps = Array.from({ length: 120 }, (_, index) => point(`t${index}`, 0.4 + index * 0.0005));
    const clusters = clusterPathPoints(taps, 0.02);
    expect(clusters.length).toBeLessThanOrEqual(4);
    expect(clusters.reduce((sum, cluster) => sum + cluster.count, 0)).toBe(120);
  });

  it('colours a cluster by its most common family, orders first on a tie', () => {
    expect(
      clusterPathPoints([point('a', 0.5, 'log'), point('b', 0.5, 'log'), point('c', 0.5)], 0.02)[0]?.family,
    ).toBe('log');
    expect(clusterPathPoints([point('a', 0.5, 'log'), point('b', 0.5, 'order')], 0.02)[0]?.family).toBe(
      'order',
    );
  });

  it('treats a bad gap as zero: only marks at the same spot merge', () => {
    expect(clusterPathPoints([point('a', 0.5), point('b', 0.5)], Number.NaN)).toHaveLength(1);
    expect(clusterPathPoints([point('a', 0.5), point('b', 0.51)], Number.NaN)).toHaveLength(2);
    expect(clusterPathPoints([], 0.02)).toEqual([]);
  });
});
