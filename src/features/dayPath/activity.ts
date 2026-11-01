import { type DayKey, toDayKey } from '@/lib/dates';

/** What happened: an order step, wake-up, a to-do, a focus, a proof log, a reward or a Truce. */
export type DayActivityKind =
  'order' | 'wake' | 'task' | 'focus' | 'selfie' | 'weight' | 'calories' | 'reward' | 'truce';

/** How a focus went: held to the end, retreated (given up) or still running. */
export type FocusMarkStyle = 'held' | 'retreated' | 'running';

/** One thing the user did today, at the moment it happened. */
export type DayActivity = {
  /** Stable and unique within the day, so a new mark can be told from an old one. */
  id: string;
  kind: DayActivityKind;
  at: Date;
  /** A focus only: when it ended (or now, while it runs). */
  until?: Date;
  focus?: FocusMarkStyle;
};

/**
 * The day's facts, as the database keeps them (rows fit these shapes). Every list holds the
 * day's rows only, except the Truce spends, which may reach back a week (see collectDayActivity).
 */
export type DayActivityInput = {
  day: DayKey;
  /** The real calendar day now. Differs from `day` only under the dev clock. */
  realDay: DayKey;
  now: Date;
  steps: readonly { id: number; orderKey: string; at: string }[];
  /** Vinco's orders' logs: a fallback mark for amounts logged before steps were recorded. */
  orderLogs: readonly { kind: string; amount: number; updatedAt: string }[];
  ownOrderLogs: readonly { orderId: number; amount: number; updatedAt: string }[];
  dayLog: {
    wokeAt: string | null;
    selfieAt: string | null;
    weightAt: string | null;
    caloriesAt: string | null;
  } | null;
  taskCompletions: readonly { taskId: number; doneAt: string }[];
  focusSessions: readonly {
    id: number;
    startedAt: string;
    endsAt: string;
    endedAt: string | null;
    status: string;
  }[];
  claims: readonly { id: number; claimedAt: string }[];
  truceSpends: readonly { day: string; createdAt: string }[];
};

export type DayActivitySummary = { count: number; lastAt: Date | null };

const WAKE_KEY = 'wake';

/** The step key of an own order; Vinco's orders use their kind ('water'). */
export function orderStepKey(orderId: number): string {
  return `own:${orderId}`;
}

/**
 * Every activity of a day, oldest first. Sources (docs/TODAY-AND-FOCUS.md section 2):
 * - order steps: one per rise (order_steps). An order logged before steps were recorded gets one
 *   mark at its log's updated_at instead. Wake-up is the wake time (day_logs.woke_at), not a step.
 * - to-dos: task_completions.done_at; focus: started_at to ended_at; rewards: claims.claimed_at.
 * - selfie, weight, calories: day_logs.selfie_at, weight_at, calories_at (null before 0013: no mark).
 * - a Truce: one mark per call (rows sharing created_at). A sick day counts on its own day; a Truce
 *   on missed days counts when it was called today (by the real clock).
 * Rows with an unreadable time are skipped.
 */
export function collectDayActivity(input: DayActivityInput): DayActivity[] {
  const items: DayActivity[] = [];
  const add = (id: string, kind: DayActivityKind, iso: string | null | undefined) => {
    const at = parseMoment(iso);
    if (at) items.push({ id, kind, at });
  };

  const wokeAt = parseMoment(input.dayLog?.wokeAt);
  if (wokeAt) items.push({ id: `wake:${wokeAt.getTime()}`, kind: 'wake', at: wokeAt });

  const stepped = new Set<string>();
  for (const step of input.steps) {
    stepped.add(step.orderKey);
    if (step.orderKey === WAKE_KEY && wokeAt) continue;
    add(`step:${step.id}`, step.orderKey === WAKE_KEY ? 'wake' : 'order', step.at);
  }
  const fallback = (key: string, amount: number, updatedAt: string) => {
    if (stepped.has(key) || !(amount > 0) || (key === WAKE_KEY && wokeAt)) return;
    add(`log:${key}`, key === WAKE_KEY ? 'wake' : 'order', updatedAt);
  };
  input.orderLogs.forEach((log) => fallback(log.kind, log.amount, log.updatedAt));
  input.ownOrderLogs.forEach((log) => fallback(orderStepKey(log.orderId), log.amount, log.updatedAt));

  input.taskCompletions.forEach((done) => add(`task:${done.taskId}:${done.doneAt}`, 'task', done.doneAt));
  input.claims.forEach((claim) => add(`claim:${claim.id}`, 'reward', claim.claimedAt));
  const proof = input.dayLog;
  add(`selfie:${proof?.selfieAt}`, 'selfie', proof?.selfieAt);
  add(`weight:${proof?.weightAt}`, 'weight', proof?.weightAt);
  add(`calories:${proof?.caloriesAt}`, 'calories', proof?.caloriesAt);

  for (const session of input.focusSessions) {
    const item = toFocusActivity(session, input.now);
    if (item) items.push(item);
  }
  for (const createdAt of truceCalls(input)) add(`truce:${createdAt}`, 'truce', createdAt);

  return items.sort((a, b) => a.at.getTime() - b.at.getTime() || a.id.localeCompare(b.id));
}

/** How many activities, and when the last one happened (a focus counts when it ended). */
export function summariseDayActivity(items: readonly DayActivity[]): DayActivitySummary {
  let lastAt: Date | null = null;
  for (const item of items) {
    const moment = item.until && item.focus !== 'running' ? item.until : item.at;
    if (!lastAt || moment.getTime() > lastAt.getTime()) lastAt = moment;
  }
  return { count: items.length, lastAt };
}

function toFocusActivity(session: DayActivityInput['focusSessions'][number], now: Date): DayActivity | null {
  const at = parseMoment(session.startedAt);
  if (!at) return null;
  const endsAt = parseMoment(session.endsAt) ?? at;
  const style: FocusMarkStyle =
    session.status === 'completed' ? 'held' : session.status === 'abandoned' ? 'retreated' : 'running';
  const end =
    style === 'running'
      ? new Date(Math.min(now.getTime(), endsAt.getTime()))
      : (parseMoment(session.endedAt) ?? endsAt);
  const until = end.getTime() < at.getTime() ? at : end;
  return { id: `focus:${session.id}`, kind: 'focus', at, until, focus: style };
}

/** One created_at per Truce call that belongs to the day, oldest first. */
function truceCalls(input: DayActivityInput): string[] {
  const calls = new Set<string>();
  for (const spend of input.truceSpends) {
    const at = parseMoment(spend.createdAt);
    if (!at) continue;
    if (spend.day === input.day || toDayKey(at) === input.realDay) calls.add(spend.createdAt);
  }
  return [...calls];
}

function parseMoment(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}
