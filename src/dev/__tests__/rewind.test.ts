import {
  addCustomOrder,
  createArc,
  editCustomOrder,
  getActiveArc,
  saveOrderAmount,
  standDownCustomOrder,
  updateDayLog,
} from '@/db';
import {
  arcs,
  claims,
  customOrderLogs,
  customOrders,
  dayLogs,
  focusSessions,
  ledger,
  orderLogs,
  orderSteps,
  reelDays,
  taskCompletions,
  tasks,
  truces,
} from '@/db/schema';
import { sealFinishedDays } from '@/db/sealing';
import { createTestDatabase } from '@/db/testing/testDatabase';
import { DEFAULT_ORDER_TARGETS, type OrderAmounts } from '@/features/orders';

import { planRewind, RewindError, rewindJourney } from '../rewind';

const START = '2026-10-12';
const HELD: OrderAmounts = { water: 1, wake: 1, meal: 1, workout: 15 };
const NOW = new Date('2026-10-20T08:00:00Z');

type Db = ReturnType<typeof createTestDatabase>;

function startCampaign(db: Db, startDay = START): number {
  return createArc(db, {
    startDay,
    lengthDays: 30,
    wakeTime: '06:30',
    targets: DEFAULT_ORDER_TARGETS,
    oathPath: null,
  });
}

function holdDay(db: Db, day: string) {
  for (const [kind, amount] of Object.entries(HELD))
    saveOrderAmount(db, day, kind as keyof OrderAmounts, amount);
}

/** Days 12 to 18 held and sealed, as if the dev clock ran to the 19th. */
function liveAWeek(db: Db) {
  startCampaign(db);
  for (let day = 12; day <= 18; day += 1) holdDay(db, `2026-10-${day}`);
  sealFinishedDays(db, { startDay: START, lengthDays: 30 }, DEFAULT_ORDER_TARGETS, '2026-10-19', NOW);
}

describe('planRewind', () => {
  it('steps back one day, never below the real clock', () => {
    expect(planRewind('2026-10-19', 3, 'previous')).toEqual({ offset: 2, newToday: '2026-10-18' });
    expect(planRewind('2026-10-17', 1, 'previous')).toEqual({ offset: 0, newToday: '2026-10-16' });
    expect(planRewind('2026-10-16', 0, 'previous')).toBeNull();
  });

  it('goes back to the real day in one step', () => {
    expect(planRewind('2026-11-03', 5, 'real')).toEqual({ offset: 0, newToday: '2026-10-29' });
    expect(planRewind('2026-10-29', 0, 'real')).toBeNull();
  });

  it('crosses a month', () => {
    expect(planRewind('2026-11-01', 1, 'previous')?.newToday).toBe('2026-10-31');
  });
});

describe('rewindJourney', () => {
  it('removes every day after the new today and opens the new today again', () => {
    const db = createTestDatabase();
    liveAWeek(db);
    updateDayLog(db, '2026-10-17', { selfiePath: 'file:///selfie-17.jpg' });
    db.insert(reelDays).values({ day: '2026-10-18', count: 4, updatedAt: NOW.toISOString() }).run();
    db.insert(focusSessions)
      .values({
        day: '2026-10-18',
        guard: 'imperium',
        minutes: 25,
        startedAt: NOW.toISOString(),
        endsAt: NOW.toISOString(),
        status: 'running',
      } as typeof focusSessions.$inferInsert)
      .run();
    db.insert(claims)
      .values({
        kind: 'labour',
        key: 'x',
        period: '2026-10-18',
        day: '2026-10-18',
        denarii: 5,
        gloria: 5,
        claimedAt: NOW.toISOString(),
      } as typeof claims.$inferInsert)
      .run();

    const result = rewindJourney(db, '2026-10-15');

    expect(result.selfiePaths).toEqual(['file:///selfie-17.jpg']);
    expect(result.removedRunningFocusId).not.toBeNull();
    const after = (rows: { day: string }[]) => rows.filter((row) => row.day > '2026-10-15');
    expect(after(db.select().from(orderLogs).all())).toEqual([]);
    expect(after(db.select().from(orderSteps).all())).toEqual([]);
    expect(after(db.select().from(dayLogs).all())).toEqual([]);
    expect(after(db.select().from(ledger).all())).toEqual([]);
    expect(after(db.select().from(truces).all())).toEqual([]);
    expect(db.select().from(focusSessions).all()).toEqual([]);
    expect(db.select().from(claims).all()).toEqual([]);
    expect(db.select().from(reelDays).all()).toEqual([]);

    const days = new Map(
      db
        .select()
        .from(dayLogs)
        .all()
        .map((row) => [row.day, row]),
    );
    // The new today is open; the days before stay sealed.
    expect(days.get('2026-10-15')?.sealedAt).toBeNull();
    expect(days.get('2026-10-15')?.result).toBeNull();
    expect(days.get('2026-10-14')?.sealedAt).not.toBeNull();
    // Its order logs stay, so today still reads as held.
    expect(
      db
        .select()
        .from(orderLogs)
        .all()
        .filter((row) => row.day === '2026-10-15'),
    ).toHaveLength(4);
    // The arc's starting Truce is kept.
    expect(
      db
        .select()
        .from(truces)
        .all()
        .some((row) => row.reason === 'arc_start'),
    ).toBe(true);
  });

  it('can seal the rewound days again, the same way', () => {
    const db = createTestDatabase();
    liveAWeek(db);
    const sealedBefore = db.select().from(ledger).all().length;
    rewindJourney(db, '2026-10-15');
    for (let day = 16; day <= 18; day += 1) holdDay(db, `2026-10-${day}`);
    sealFinishedDays(db, { startDay: START, lengthDays: 30 }, DEFAULT_ORDER_TARGETS, '2026-10-19', NOW);
    expect(db.select().from(ledger).all().length).toBe(sealedBefore);
  });

  it('brings carried tasks back and removes tasks dated later', () => {
    const db = createTestDatabase();
    startCampaign(db);
    const createdAt = NOW.toISOString();
    const carried = db
      .insert(tasks)
      .values({ title: 'Carried', repeat: 'once', day: '2026-10-18', carriedFrom: '2026-10-13', createdAt })
      .returning({ id: tasks.id })
      .get().id;
    const fromToday = db
      .insert(tasks)
      .values({ title: 'Own day', repeat: 'once', day: '2026-10-17', carriedFrom: '2026-10-15', createdAt })
      .returning({ id: tasks.id })
      .get().id;
    const later = db
      .insert(tasks)
      .values({ title: 'Later', repeat: 'once', day: '2026-10-17', createdAt })
      .returning({ id: tasks.id })
      .get().id;
    db.insert(taskCompletions).values({ taskId: later, day: '2026-10-17', doneAt: createdAt }).run();

    rewindJourney(db, '2026-10-15');

    const rows = new Map(
      db
        .select()
        .from(tasks)
        .all()
        .map((row) => [row.id, row]),
    );
    expect(rows.get(carried)).toMatchObject({ day: '2026-10-15', carriedFrom: '2026-10-13' });
    expect(rows.get(fromToday)).toMatchObject({ day: '2026-10-15', carriedFrom: null });
    expect(rows.has(later)).toBe(false);
    expect(db.select().from(taskCompletions).all()).toEqual([]);
  });

  it('undoes own orders added, stood down or lowered later, and keeps a lower goal set today', () => {
    const db = createTestDatabase();
    const arcId = startCampaign(db);
    const steady = addCustomOrder(db, arcId, { name: 'Read', unit: 'pages', min: 10, full: 10 }, START);
    const loweredToday = addCustomOrder(db, arcId, { name: 'Walk', unit: 'km', min: 5, full: 5 }, START);
    editCustomOrder(db, loweredToday, { name: 'Walk', unit: 'km', min: 3, full: 3 }, '2026-10-15');
    standDownCustomOrder(db, steady, '2026-10-17');
    const added = addCustomOrder(db, arcId, { name: 'Stretch', unit: '', min: 1, full: 1 }, '2026-10-17');
    db.insert(customOrderLogs)
      .values({ orderId: added, day: '2026-10-17', amount: 1, updatedAt: NOW.toISOString() })
      .run();

    rewindJourney(db, '2026-10-15');

    const rows = new Map(
      db
        .select()
        .from(customOrders)
        .all()
        .map((row) => [row.id, row]),
    );
    expect(rows.get(steady)?.lastDay).toBeNull();
    expect(rows.get(loweredToday)?.lastDay).toBe('2026-10-15');
    expect([...rows.values()].some((row) => row.replacesId === loweredToday)).toBe(true);
    expect(rows.has(added)).toBe(false);
    expect(db.select().from(customOrderLogs).all()).toEqual([]);
  });

  it('removes an arc begun later and makes the one before active again', () => {
    const db = createTestDatabase();
    const first = startCampaign(db);
    startCampaign(db, '2026-10-20');
    rewindJourney(db, '2026-10-15');
    expect(db.select().from(arcs).all()).toHaveLength(1);
    expect(getActiveArc(db)?.id).toBe(first);
  });

  it('refuses to go back before the first arc, and changes nothing', () => {
    const db = createTestDatabase();
    liveAWeek(db);
    const before = db.select().from(orderLogs).all().length;
    expect(() => rewindJourney(db, '2026-10-11')).toThrow(RewindError);
    expect(db.select().from(orderLogs).all()).toHaveLength(before);
    expect(getActiveArc(db)).toBeDefined();
  });
});
