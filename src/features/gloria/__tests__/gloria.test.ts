import { DEFAULT_ORDER_TARGETS } from '@/features/orders';

import {
  buildJourneyDays,
  conqueredDayGloria,
  findArcOn,
  getDayGloria,
  GLORIA,
  gloriaLevel,
  type JourneyInput,
  sumGloria,
  weekGloria,
} from '../index';

const DAY = '2026-10-28';
const ARC = {
  id: 1,
  startDay: '2026-10-26',
  lengthDays: 30,
  wakeTime: '06:30',
  targets: DEFAULT_ORDER_TARGETS,
};

function input(patch: Partial<JourneyInput> = {}): JourneyInput {
  return {
    arcs: [ARC],
    orderLogs: [],
    customOrders: [],
    customLogs: [],
    dayLogs: [],
    taskCompletions: [],
    focusSessions: [],
    claims: [],
    ...patch,
  };
}

const held = [
  { day: DAY, kind: 'water' as const, amount: 1 },
  { day: DAY, kind: 'wake' as const, amount: 1 },
  { day: DAY, kind: 'meal' as const, amount: 1 },
  { day: DAY, kind: 'workout' as const, amount: 15 },
];
const conquered = [
  { day: DAY, kind: 'water' as const, amount: 4 },
  { day: DAY, kind: 'wake' as const, amount: 1 },
  { day: DAY, kind: 'meal' as const, amount: 2 },
  { day: DAY, kind: 'workout' as const, amount: 40 },
];

function dayOf(patch: Partial<JourneyInput>) {
  const day = buildJourneyDays(input(patch), DAY, DAY).get(DAY);
  if (!day) throw new Error('missing day');
  return day;
}

describe('buildJourneyDays', () => {
  it('builds every day of the range, even empty ones', () => {
    const days = buildJourneyDays(input(), '2026-10-26', '2026-11-01');
    expect([...days.keys()]).toHaveLength(7);
    expect(days.get('2026-10-30')?.result).toBe('missed');
    expect(buildJourneyDays(input(), '2026-11-02', '2026-11-01').size).toBe(0);
  });

  it('judges a held and a conquered day from the logs', () => {
    expect(dayOf({ orderLogs: held }).result).toBe('held');
    expect(dayOf({ orderLogs: conquered }).result).toBe('conquered');
  });

  it('trusts a sealed result over the logs', () => {
    const day = dayOf({
      orderLogs: held,
      dayLogs: [{ day: DAY, selfiePath: null, weightKg: null, wokeAt: null, result: 'conquered' }],
    });
    expect(day.result).toBe('conquered');
  });

  it('gives a day with no orders no result (free training with nothing picked)', () => {
    const day = dayOf({ arcs: [{ ...ARC, targets: {} }], taskCompletions: [{ day: DAY }] });
    expect(day.result).toBe('none');
    expect(day.orderStatuses).toEqual([]);
    expect(day.todosDone).toBe(1);
  });

  it("counts an own order active that day, and only that arc's", () => {
    const own = { id: 7, arcId: 1, min: 10, full: 10, firstDay: DAY, lastDay: null };
    const other = { ...own, id: 8, arcId: 2 };
    const day = dayOf({
      orderLogs: conquered,
      customOrders: [own, other],
      customLogs: [{ orderId: 7, day: DAY, amount: 3 }],
    });
    expect(day.orderStatuses).toHaveLength(5);
    expect(day.result).toBe('missed');
  });

  it('counts only completed focus minutes, and claims on their day', () => {
    const day = dayOf({
      focusSessions: [
        { day: DAY, minutes: 25, status: 'completed' },
        { day: DAY, minutes: 60, status: 'abandoned' },
        { day: DAY, minutes: 30, status: 'running' },
      ],
      claims: [{ day: DAY, denarii: 5, gloria: 15 }],
    });
    expect(day.focusMinutes).toBe(25);
    expect(day.claimGloria).toBe(15);
    expect(day.claimDenarii).toBe(5);
  });

  it('marks waking on time against the arc wake time', () => {
    const at = (hours: number, minutes: number) => new Date(2026, 9, 28, hours, minutes).toISOString();
    const woke = (wokeAt: string) =>
      dayOf({ dayLogs: [{ day: DAY, selfiePath: 'a.jpg', weightKg: 80, wokeAt, result: null }] });
    expect(woke(at(6, 30)).wokeOnTime).toBe(true);
    expect(woke(at(6, 31)).wokeOnTime).toBe(false);
    expect(woke(at(6, 0)).hasSelfie).toBe(true);
    expect(woke(at(6, 0)).hasWeight).toBe(true);
  });

  it('picks the newest arc when two cover a day', () => {
    const newer = { ...ARC, id: 2, startDay: DAY, targets: { water: DEFAULT_ORDER_TARGETS.water } };
    expect(findArcOn([ARC, newer], DAY)?.id).toBe(2);
    expect(findArcOn([ARC], '2026-10-01')).toBeNull();
  });
});

describe('getDayGloria', () => {
  it('pays orders held, full goals, a conquered day, to-dos, focus and claims', () => {
    const day = dayOf({
      orderLogs: conquered,
      taskCompletions: [{ day: DAY }, { day: DAY }],
      focusSessions: [{ day: DAY, minutes: 25, status: 'completed' }],
      claims: [{ day: DAY, denarii: 3, gloria: 10 }],
    });
    const gloria = getDayGloria(day);
    expect(gloria.orders).toBe(4 * (GLORIA.orderHeld + GLORIA.orderFull));
    expect(gloria.conquered).toBe(GLORIA.dayConquered);
    expect(gloria.todos).toBe(6);
    expect(gloria.focus).toBe(25);
    expect(gloria.claims).toBe(10);
    expect(gloria.total).toBe(60 + 20 + 6 + 25 + 10);
  });

  it('is derived: undoing a log takes the Gloria back', () => {
    // Wake-up is done or not, so its minimum is its full goal: 10 + 5.
    expect(getDayGloria(dayOf({ orderLogs: held })).total).toBe(45);
    const undone = held.map((log) => (log.kind === 'meal' ? { ...log, amount: 0 } : log));
    expect(getDayGloria(dayOf({ orderLogs: undone })).total).toBe(35);
  });

  it('sums a journey and lays out a week', () => {
    const days = buildJourneyDays(input({ orderLogs: held }), '2026-10-26', DAY);
    const { total, byDay } = sumGloria(days.values());
    expect(total).toBe(45);
    const week = weekGloria('2026-10-26', byDay);
    expect(week.map((day) => day.gloria)).toEqual([0, 0, 45, 0, 0, 0, 0]);
    expect(week[6]?.day).toBe('2026-11-01');
  });
});

describe('gloria levels', () => {
  it('steps the calendar tint', () => {
    expect([0, 1, 39, 40, 79, 80, Number.NaN].map(gloriaLevel)).toEqual([0, 1, 1, 2, 2, 3, 0]);
  });

  it("knows what a conquered day is worth with today's orders", () => {
    expect(conqueredDayGloria(4)).toBe(80);
    expect(conqueredDayGloria(0)).toBe(0);
  });
});
