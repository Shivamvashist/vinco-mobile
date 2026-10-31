import type { JourneyDay } from '@/features/gloria';

import {
  checkLabourClaim,
  claimKey,
  claimReason,
  daysUntilReset,
  getLabourBoard,
  type LabourFacts,
  labourPeriod,
  rankLabours,
  resolveClaimPay,
  toLabourFacts,
  topLabours,
} from '../index';

const SATURDAY = '2026-10-31';
const SUNDAY = '2026-11-01';
const MONDAY = '2026-11-02';

const NOTHING: LabourFacts = {
  hasOrders: true,
  hasSelfieToday: false,
  hasWeightToday: false,
  focusMinutesToday: 0,
  todosDoneToday: 0,
  isTodayConquered: false,
  daysHeldThisWeek: 0,
  daysConqueredThisWeek: 0,
  focusMinutesThisWeek: 0,
  wakeOnTimeDaysThisWeek: 0,
};

function journeyDay(day: string, patch: Partial<JourneyDay> = {}): JourneyDay {
  return {
    day,
    orderStatuses: ['none'],
    result: 'missed',
    todosDone: 0,
    focusMinutes: 0,
    claimGloria: 0,
    claimDenarii: 0,
    hasSelfie: false,
    hasWeight: false,
    wokeOnTime: false,
    ...patch,
  };
}

const stateOf = (facts: Partial<LabourFacts>, id: string, claimed = new Set<string>(), today = SATURDAY) =>
  getLabourBoard({ ...NOTHING, ...facts }, claimed, today).find((item) => item.labour.id === id)?.state;

describe('periods', () => {
  it('runs daily labours per day and weekly ones Monday to Sunday', () => {
    expect(labourPeriod('daily', SATURDAY)).toBe(SATURDAY);
    expect(labourPeriod('weekly', SATURDAY)).toBe('2026-10-26');
    expect(labourPeriod('weekly', SUNDAY)).toBe('2026-10-26');
    expect(labourPeriod('weekly', MONDAY)).toBe(MONDAY);
  });

  it('says when each resets', () => {
    expect(daysUntilReset('daily', SATURDAY)).toBe(1);
    expect(daysUntilReset('weekly', SUNDAY)).toBe(1);
    expect(daysUntilReset('weekly', MONDAY)).toBe(7);
  });
});

describe('toLabourFacts', () => {
  it('reads today and this week only', () => {
    const days = new Map(
      [
        journeyDay('2026-10-25', { result: 'conquered', wokeOnTime: true }), // last Sunday
        journeyDay('2026-10-26', { result: 'held', wokeOnTime: true, focusMinutes: 60 }),
        journeyDay('2026-10-27', { result: 'conquered', focusMinutes: 30 }),
        journeyDay(SATURDAY, { result: 'conquered', hasSelfie: true, todosDone: 2, focusMinutes: 10 }),
      ].map((day) => [day.day, day]),
    );
    const facts = toLabourFacts(days, SATURDAY);
    expect(facts.daysHeldThisWeek).toBe(3);
    expect(facts.daysConqueredThisWeek).toBe(2);
    expect(facts.focusMinutesThisWeek).toBe(100);
    expect(facts.wakeOnTimeDaysThisWeek).toBe(1);
    expect(facts).toMatchObject({ hasSelfieToday: true, todosDoneToday: 2, isTodayConquered: true });
  });

  it('starts the week fresh on Monday', () => {
    const days = new Map([journeyDay(SUNDAY, { result: 'held' }), journeyDay(MONDAY)].map((d) => [d.day, d]));
    expect(toLabourFacts(days, MONDAY).daysHeldThisWeek).toBe(0);
    expect(toLabourFacts(days, SUNDAY).daysHeldThisWeek).toBe(1);
  });

  it('has no orders on a day without any', () => {
    const days = new Map([[SATURDAY, journeyDay(SATURDAY, { orderStatuses: [], result: 'none' })]]);
    expect(toLabourFacts(days, SATURDAY).hasOrders).toBe(false);
  });
});

describe('the board', () => {
  it('becomes claimable when done, and stops being so when undone', () => {
    expect(stateOf({ hasSelfieToday: true }, 'selfie')).toBe('claimable');
    expect(stateOf({ hasSelfieToday: false }, 'selfie')).toBe('working');
    expect(stateOf({ focusMinutesToday: 24 }, 'focus')).toBe('working');
    expect(stateOf({ focusMinutesToday: 25 }, 'focus')).toBe('claimable');
  });

  it('marks a claim for this period only', () => {
    const claimed = new Set([claimKey('labour', 'selfie', SATURDAY)]);
    expect(stateOf({ hasSelfieToday: true }, 'selfie', claimed)).toBe('claimed');
    expect(stateOf({ hasSelfieToday: true }, 'selfie', claimed, SUNDAY)).toBe('claimable');
    const weekly = new Set([claimKey('labour', 'holdWeek', '2026-10-26')]);
    expect(stateOf({ daysHeldThisWeek: 5 }, 'holdWeek', weekly, SUNDAY)).toBe('claimed');
    expect(stateOf({ daysHeldThisWeek: 5 }, 'holdWeek', weekly, MONDAY)).toBe('claimable');
  });

  it('needs orders for conquer and hold labours only', () => {
    expect(stateOf({ hasOrders: false, isTodayConquered: true }, 'conquer')).toBe('unavailable');
    expect(stateOf({ hasOrders: false, daysHeldThisWeek: 5 }, 'holdWeek')).toBe('unavailable');
    expect(stateOf({ hasOrders: false, hasSelfieToday: true }, 'selfie')).toBe('claimable');
  });

  it('caps progress at the goal', () => {
    const board = getLabourBoard({ ...NOTHING, todosDoneToday: 9 }, new Set(), SATURDAY);
    const todos = board.find((item) => item.labour.id === 'todos');
    expect(todos).toMatchObject({ current: 3, ratio: 1 });
  });

  it('ranks claimable first, then closest to done, daily before weekly, claimed last', () => {
    const claimed = new Set([claimKey('labour', 'weight', SATURDAY)]);
    const board = getLabourBoard(
      { ...NOTHING, hasWeightToday: true, focusMinutesThisWeek: 90, todosDoneToday: 1, daysHeldThisWeek: 5 },
      claimed,
      SATURDAY,
    );
    const ranked = rankLabours(board).map((item) => item.labour.id);
    expect(ranked[0]).toBe('holdWeek');
    expect(ranked.indexOf('focusWeek')).toBeLessThan(ranked.indexOf('todos'));
    expect(ranked.at(-1)).toBe('weight');
    const top = topLabours(board).map((item) => item.labour.id);
    expect(top).toEqual(['holdWeek', 'focusWeek', 'todos']);
  });

  it('breaks ties daily before weekly', () => {
    const top = topLabours(getLabourBoard(NOTHING, new Set(), SATURDAY)).map((item) => item.labour.type);
    expect(top).toEqual(['daily', 'daily', 'daily']);
  });

  it('checks a claim', () => {
    const board = getLabourBoard({ ...NOTHING, hasSelfieToday: true }, new Set(), SATURDAY);
    expect(checkLabourClaim(board.find((item) => item.labour.id === 'selfie'))).toBe('ok');
    expect(checkLabourClaim(board.find((item) => item.labour.id === 'weight'))).toBe('incomplete');
    expect(checkLabourClaim(undefined)).toBe('unavailable');
  });
});

describe('claim pay', () => {
  it('writes ledger reasons per kind', () => {
    expect(claimReason('labour', 'selfie')).toBe('labour_selfie');
    expect(claimReason('decoration', 'firstSeal')).toBe('decoration_firstSeal');
  });

  it('grants a Truce while there is room, and its price in denarii at the cap', () => {
    const reward = { denarii: 20, gloria: 120, truces: 1 };
    expect(resolveClaimPay(reward, 0)).toEqual({ denarii: 20, gloria: 120, truces: 1, trucesConverted: 0 });
    expect(resolveClaimPay(reward, 3)).toEqual({ denarii: 70, gloria: 120, truces: 0, trucesConverted: 1 });
    expect(resolveClaimPay({ denarii: 5, gloria: 10 }, 3).truces).toBe(0);
  });
});
