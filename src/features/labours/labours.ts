/**
 * Labours ("Labores", tasks to earn): a bounty board. Daily ones are new every day, weekly ones
 * run Monday to Sunday. Each has a goal, live progress from the records, and a reward paid when
 * claimed by hand, once per period. An unclaimed labour expires with its period. Pure.
 * See docs/REWARDS.md.
 */
import type { ClaimReason } from '@/features/campaign';
import type { JourneyDay } from '@/features/gloria';
import { weekStartOf } from '@/features/logs';
import { addDays, type DayKey, daysBetween, eachDay } from '@/lib/dates';

import { LABOUR_RULES, type LabourId, type Reward } from './rewards';

export type LabourType = 'daily' | 'weekly';

/** What a claim is for: a labour (once per period) or a decoration (once, forever). */
export type ClaimKind = 'labour' | 'decoration';

/** The period of a decoration claim. */
export const FOREVER_PERIOD = 'forever';

export type Labour = {
  id: LabourId;
  type: LabourType;
  goal: number;
  reward: Reward;
  /** Needs orders today ("conquer", "hold"): a day with no orders never holds. */
  needsOrders: boolean;
};

const labour = (id: LabourId, type: LabourType, needsOrders = false): Labour => ({
  id,
  type,
  goal: LABOUR_RULES[id].goal,
  reward: LABOUR_RULES[id].reward,
  needsOrders,
});

/** Every labour, daily first, in the board's tie-break order. */
export const LABOURS: readonly Labour[] = [
  labour('selfie', 'daily'),
  labour('weight', 'daily'),
  labour('focus', 'daily'),
  labour('todos', 'daily'),
  labour('conquer', 'daily', true),
  labour('holdWeek', 'weekly', true),
  labour('conquerWeek', 'weekly', true),
  labour('focusWeek', 'weekly'),
  labour('wakeWeek', 'weekly'),
];

/** What the board measures, assembled from the journey's days. */
export type LabourFacts = {
  /** Today has at least one order. */
  hasOrders: boolean;
  hasSelfieToday: boolean;
  hasWeightToday: boolean;
  focusMinutesToday: number;
  todosDoneToday: number;
  isTodayConquered: boolean;
  /** Days held or conquered this week (Monday to today), today included while it holds. */
  daysHeldThisWeek: number;
  daysConqueredThisWeek: number;
  focusMinutesThisWeek: number;
  wakeOnTimeDaysThisWeek: number;
};

export type LabourState = 'claimable' | 'working' | 'claimed' | 'unavailable';

export type LabourStatus = {
  labour: Labour;
  /** The day (daily) or the week's Monday (weekly) it pays for. */
  period: string;
  /** Progress, capped at the goal. */
  current: number;
  /** 0 to 1. */
  ratio: number;
  state: LabourState;
};

export type ClaimCheck = 'ok' | 'incomplete' | 'claimed' | 'unavailable';

/** The facts for today's board from the days of this week (a missing day counts as nothing). */
export function toLabourFacts(days: ReadonlyMap<DayKey, JourneyDay>, today: DayKey): LabourFacts {
  const week = eachDay(weekStartOf(today), today)
    .map((day) => days.get(day))
    .filter((day): day is JourneyDay => day != null);
  const now = days.get(today);
  return {
    hasOrders: (now?.orderStatuses.length ?? 0) > 0,
    hasSelfieToday: now?.hasSelfie ?? false,
    hasWeightToday: now?.hasWeight ?? false,
    focusMinutesToday: now?.focusMinutes ?? 0,
    todosDoneToday: now?.todosDone ?? 0,
    isTodayConquered: now?.result === 'conquered',
    daysHeldThisWeek: week.filter((day) => day.result === 'held' || day.result === 'conquered').length,
    daysConqueredThisWeek: week.filter((day) => day.result === 'conquered').length,
    focusMinutesThisWeek: week.reduce((sum, day) => sum + day.focusMinutes, 0),
    wakeOnTimeDaysThisWeek: week.filter((day) => day.wokeOnTime).length,
  };
}

/** How far a labour has got, uncapped. */
export function measureLabour(id: LabourId, facts: LabourFacts): number {
  switch (id) {
    case 'selfie':
      return facts.hasSelfieToday ? 1 : 0;
    case 'weight':
      return facts.hasWeightToday ? 1 : 0;
    case 'focus':
      return facts.focusMinutesToday;
    case 'todos':
      return facts.todosDoneToday;
    case 'conquer':
      return facts.isTodayConquered ? 1 : 0;
    case 'holdWeek':
      return facts.daysHeldThisWeek;
    case 'conquerWeek':
      return facts.daysConqueredThisWeek;
    case 'focusWeek':
      return facts.focusMinutesThisWeek;
    case 'wakeWeek':
      return facts.wakeOnTimeDaysThisWeek;
  }
}

/** The period a labour pays for today: the day, or the Monday of this week. */
export function labourPeriod(type: LabourType, today: DayKey): string {
  return type === 'daily' ? today : weekStartOf(today);
}

/** Days until a labour starts over: 1 for daily, 1 to 7 for weekly (next Monday). */
export function daysUntilReset(type: LabourType, today: DayKey): number {
  return type === 'daily' ? 1 : daysBetween(today, addDays(weekStartOf(today), 7));
}

/** One key per claim, for looking claims up: "labour:selfie:2026-10-31". */
export function claimKey(kind: ClaimKind, key: string, period: string): string {
  return `${kind}:${key}:${period}`;
}

/** The ledger reason a claim's denarii are written under. */
export function claimReason(kind: ClaimKind, key: string): ClaimReason {
  return kind === 'labour' ? `labour_${key}` : `decoration_${key}`;
}

/** Every labour with its progress and state, in definition order. */
export function getLabourBoard(
  facts: LabourFacts,
  claimed: ReadonlySet<string>,
  today: DayKey,
): LabourStatus[] {
  return LABOURS.map((item) => {
    const period = labourPeriod(item.type, today);
    const raw = measureLabour(item.id, facts);
    const current = Math.min(item.goal, Math.max(0, Number.isFinite(raw) ? raw : 0));
    const ratio = item.goal > 0 ? current / item.goal : 0;
    const state: LabourState = claimed.has(claimKey('labour', item.id, period))
      ? 'claimed'
      : item.needsOrders && !facts.hasOrders
        ? 'unavailable'
        : ratio >= 1
          ? 'claimable'
          : 'working';
    return { labour: item, period, current, ratio, state };
  });
}

const STATE_ORDER: Record<LabourState, number> = { claimable: 0, working: 1, unavailable: 2, claimed: 3 };

/** Claimable first, then the closest to done, then daily before weekly; claimed ones last. */
export function rankLabours(board: readonly LabourStatus[]): LabourStatus[] {
  const index = new Map(LABOURS.map((item, position) => [item.id, position]));
  return [...board].sort(
    (a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      b.ratio - a.ratio ||
      (a.labour.type === b.labour.type ? 0 : a.labour.type === 'daily' ? -1 : 1) ||
      (index.get(a.labour.id) ?? 0) - (index.get(b.labour.id) ?? 0),
  );
}

/** Today's top labours: never a claimed or unavailable one. */
export function topLabours(board: readonly LabourStatus[], count = 3): LabourStatus[] {
  return rankLabours(board)
    .filter((status) => status.state === 'claimable' || status.state === 'working')
    .slice(0, count);
}

/** Whether a labour can be claimed now. */
export function checkLabourClaim(status: LabourStatus | undefined): ClaimCheck {
  if (!status) return 'unavailable';
  switch (status.state) {
    case 'claimable':
      return 'ok';
    case 'claimed':
      return 'claimed';
    case 'unavailable':
      return 'unavailable';
    case 'working':
      return 'incomplete';
  }
}

/** A labour by id. */
export function getLabour(id: LabourId): Labour {
  const found = LABOURS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown labour: ${id}`);
  return found;
}

/** Narrows a stored text to a labour id. */
export function isLabourId(value: unknown): value is LabourId {
  return typeof value === 'string' && LABOURS.some((item) => item.id === value);
}
