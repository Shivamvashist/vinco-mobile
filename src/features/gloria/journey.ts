/**
 * The journey, day by day, from the records: what each day held, and the facts the Labours and
 * Gloria read (selfie, weight, wake on time, to-dos, focus minutes, claims). Pure: the database
 * layer loads the rows, this turns them into days. See docs/REWARDS.md.
 */
import { arcEndDay } from '@/features/arc';
import { getDayResult, isSealedResult } from '@/features/campaign';
import { heldMinutes } from '@/features/focus';
import {
  getCustomOrderStatus,
  getOrderStatus,
  isCustomOrderActiveOn,
  type OrderAmounts,
  type OrderKind,
  orderKindsIn,
  type OrderStatus,
  type OrderTargets,
} from '@/features/orders';
import { type DayKey, eachDay, parseClockMinutes } from '@/lib/dates';

/** An arc as the journey needs it: when it ran, its wake time and its Vinco orders. */
export type JourneyArc = {
  id: number;
  startDay: DayKey;
  lengthDays: number;
  /** 'HH:MM', 24-hour. */
  wakeTime: string;
  targets: OrderTargets;
};

export type JourneyInput = {
  arcs: readonly JourneyArc[];
  orderLogs: readonly { day: DayKey; kind: OrderKind; amount: number }[];
  customOrders: readonly {
    id: number;
    arcId: number;
    min: number;
    full: number;
    firstDay: DayKey;
    lastDay: DayKey | null;
  }[];
  customLogs: readonly { orderId: number; day: DayKey; amount: number }[];
  dayLogs: readonly {
    day: DayKey;
    selfiePath: string | null;
    weightKg: number | null;
    wokeAt: string | null;
    result: string | null;
  }[];
  taskCompletions: readonly { day: DayKey }[];
  focusSessions: readonly { day: DayKey; minutes: number; status: string }[];
  claims: readonly { day: DayKey; denarii: number; gloria: number }[];
};

/** How a day stands: 'none' when it had no orders at all (such a day never holds). */
export type JourneyResult = 'conquered' | 'held' | 'missed' | 'none';

export type JourneyDay = {
  day: DayKey;
  /** Every order that counted that day (Vinco's and the user's own), as far as it got. */
  orderStatuses: OrderStatus[];
  /** The sealed result when stored, otherwise where the day stands now. */
  result: JourneyResult;
  todosDone: number;
  /** Minutes of focus held to the end (completed sessions only). */
  focusMinutes: number;
  claimGloria: number;
  claimDenarii: number;
  hasSelfie: boolean;
  hasWeight: boolean;
  /** Woke at or before the arc's planned wake time. */
  wokeOnTime: boolean;
};

/** Every day from `from` to `to` (inclusive), each with its facts. Empty when `to` is before `from`. */
export function buildJourneyDays(input: JourneyInput, from: DayKey, to: DayKey): Map<DayKey, JourneyDay> {
  const days = new Map<DayKey, JourneyDay>();
  for (const day of eachDay(from, to)) days.set(day, emptyDay(day));
  if (days.size === 0) return days;

  const amountsByDay = new Map<DayKey, OrderAmounts>();
  for (const log of input.orderLogs) {
    if (!days.has(log.day)) continue;
    const amounts = amountsByDay.get(log.day) ?? { water: 0, wake: 0, meal: 0, workout: 0 };
    amounts[log.kind] = Number.isFinite(log.amount) ? log.amount : 0;
    amountsByDay.set(log.day, amounts);
  }
  const ownAmounts = new Map<string, number>();
  for (const log of input.customLogs) {
    if (Number.isFinite(log.amount)) ownAmounts.set(`${log.orderId}:${log.day}`, log.amount);
  }
  const logsByDay = new Map(input.dayLogs.map((log) => [log.day, log]));

  for (const entry of days.values()) {
    const arc = findArcOn(input.arcs, entry.day);
    const log = logsByDay.get(entry.day);
    entry.hasSelfie = log?.selfiePath != null;
    entry.hasWeight = log?.weightKg != null;
    if (!arc) continue;
    entry.wokeOnTime = isOnTime(log?.wokeAt ?? null, arc.wakeTime);

    const amounts = amountsByDay.get(entry.day) ?? { water: 0, wake: 0, meal: 0, workout: 0 };
    const vinco = orderKindsIn(arc.targets).map((kind) => {
      const target = arc.targets[kind];
      return target ? getOrderStatus(amounts[kind], target) : 'none';
    });
    const own = input.customOrders
      .filter((order) => order.arcId === arc.id && isCustomOrderActiveOn(order, entry.day))
      .map((order) => getCustomOrderStatus(ownAmounts.get(`${order.id}:${entry.day}`) ?? 0, order));
    entry.orderStatuses = [...vinco, ...own];
    if (entry.orderStatuses.length === 0) continue;
    if (isSealedResult(log?.result)) {
      entry.result = log.result;
    } else {
      const result = getDayResult(amounts, arc.targets, false, own);
      entry.result = result === 'truce' ? 'missed' : result;
    }
  }

  for (const tick of input.taskCompletions) {
    const entry = days.get(tick.day);
    if (entry) entry.todosDone += 1;
  }
  for (const session of input.focusSessions) {
    const entry = days.get(session.day);
    if (entry) entry.focusMinutes += heldMinutes(session);
  }
  for (const claim of input.claims) {
    const entry = days.get(claim.day);
    if (!entry) continue;
    entry.claimGloria += Number.isFinite(claim.gloria) ? claim.gloria : 0;
    entry.claimDenarii += Number.isFinite(claim.denarii) ? claim.denarii : 0;
  }
  return days;
}

/** The arc a day belongs to: the newest one whose dates cover it, or null. */
export function findArcOn(arcs: readonly JourneyArc[], day: DayKey): JourneyArc | null {
  let found: JourneyArc | null = null;
  for (const arc of arcs) {
    const covers = arc.startDay <= day && day <= arcEndDay(arc.startDay, arc.lengthDays);
    if (covers && (found == null || arc.id > found.id)) found = arc;
  }
  return found;
}

function emptyDay(day: DayKey): JourneyDay {
  return {
    day,
    orderStatuses: [],
    result: 'none',
    todosDone: 0,
    focusMinutes: 0,
    claimGloria: 0,
    claimDenarii: 0,
    hasSelfie: false,
    hasWeight: false,
    wokeOnTime: false,
  };
}

/** Woke (a logged moment) at or before the planned 'HH:MM', on the phone's local clock. */
function isOnTime(wokeAt: string | null, wakeTime: string): boolean {
  if (!wokeAt) return false;
  const moment = new Date(wokeAt);
  const planned = parseClockMinutes(wakeTime);
  if (Number.isNaN(moment.getTime()) || planned == null) return false;
  return moment.getHours() * 60 + moment.getMinutes() <= planned;
}
