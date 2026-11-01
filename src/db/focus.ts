import { and, desc, eq, inArray } from 'drizzle-orm';

import { FOCUS_REASONS } from '@/features/campaign';
import {
  canRetreat,
  clampFocusMinutes,
  focusEndsAt,
  type FocusGuard,
  focusRetreatReason,
  focusReward,
  getFocusState,
  isFocusGuard,
  nextFocusReason,
} from '@/features/focus';
import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { type FocusSessionRow, focusSessions, ledger, truces } from './schema';
import { getTruceReserve } from './truces';

/** Why a focus could not begin: one is already running, or the guard is unknown. */
export class FocusError extends Error {
  constructor(readonly reason: 'busy' | 'invalid') {
    super(`Focus not started: ${reason}`);
    this.name = 'FocusError';
  }
}

export type NewFocus = { day: DayKey; guard: FocusGuard; minutes: number };

/** Begins a focus now. Throws FocusError('busy') while another one runs: one at a time. */
export function startFocus(db: AppDatabase, focus: NewFocus, now: Date = new Date()): FocusSessionRow {
  if (!isFocusGuard(focus.guard)) throw new FocusError('invalid');
  const minutes = clampFocusMinutes(focus.minutes);
  return db.transaction((tx) => {
    if (getRunningFocus(tx)) throw new FocusError('busy');
    return tx
      .insert(focusSessions)
      .values({
        day: focus.day,
        guard: focus.guard,
        minutes,
        startedAt: nowIso(now),
        endsAt: focusEndsAt(now, minutes).toISOString(),
        status: 'running',
        reward: 0,
      })
      .returning()
      .get();
  });
}

/** Gives up the running focus: it pays nothing. Returns the session, or null when none was running. */
export function abandonFocus(db: AppDatabase, id: number, now: Date = new Date()): FocusSessionRow | null {
  return (
    db
      .update(focusSessions)
      .set({ status: 'abandoned', endedAt: nowIso(now), reward: 0 })
      .where(and(eq(focusSessions.id, id), eq(focusSessions.status, 'running')))
      .returning()
      .get() ?? null
  );
}

/** What a retreat did: given up (a Truce spent), refused for want of a Truce, or nothing to retreat from. */
export type FocusRetreat =
  { status: 'retreated'; session: FocusSessionRow } | { status: 'noTruce' } | { status: 'none' };

/**
 * Retreats from a running focus, in one transaction with fresh values: it spends one Truce from
 * the reserve and closes the session. With no Truce held it returns 'noTruce' and changes nothing
 * (the focus runs on). The Truce is keyed by the session ('focus_retreat_<id>'), so several
 * retreats in a day never collide and one session is never charged twice. Retreating never pays.
 */
export function retreatFocus(db: AppDatabase, id: number, now: Date = new Date()): FocusRetreat {
  return db.transaction((tx): FocusRetreat => {
    const running = tx
      .select()
      .from(focusSessions)
      .where(and(eq(focusSessions.id, id), eq(focusSessions.status, 'running')))
      .get();
    if (!running) return { status: 'none' };
    if (!canRetreat(getTruceReserve(tx))) return { status: 'noTruce' };
    const createdAt = nowIso(now);
    tx.insert(truces)
      .values({ day: running.day, reason: focusRetreatReason(running.id), amount: -1, createdAt })
      .onConflictDoNothing()
      .run();
    const session = tx
      .update(focusSessions)
      .set({ status: 'abandoned', endedAt: createdAt, reward: 0 })
      .where(eq(focusSessions.id, running.id))
      .returning()
      .get();
    if (!session) throw new Error('Focus retreat: the session could not be closed.');
    return { status: 'retreated', session };
  });
}

/**
 * Completes the running focus if its time is up at `now`, and pays it with the next free focus
 * reason of the day it began on (nothing when under 10 minutes or three were paid that day).
 * One transaction, so it can never pay twice. Returns the completed session, or null when there
 * was nothing due (none running, still running, or the clock was set back before its start).
 */
export function settleFocus(db: AppDatabase, now: Date = new Date()): FocusSessionRow | null {
  return db.transaction((tx) => {
    const running = getRunningFocus(tx);
    if (!running || getFocusState(running, now) !== 'due') return null;
    const base = isFocusGuard(running.guard) ? focusReward(running.minutes, running.guard) : 0;
    let reward = 0;
    if (base > 0) {
      const used = tx
        .select({ reason: ledger.reason })
        .from(ledger)
        .where(and(eq(ledger.day, running.day), inArray(ledger.reason, [...FOCUS_REASONS])))
        .all()
        .map((row) => row.reason);
      const reason = nextFocusReason(used);
      if (reason) {
        tx.insert(ledger)
          .values({ day: running.day, reason, amount: base, createdAt: nowIso(now) })
          .onConflictDoNothing()
          .run();
        reward = base;
      }
    }
    return (
      tx
        .update(focusSessions)
        .set({ status: 'completed', endedAt: nowIso(now), reward })
        .where(and(eq(focusSessions.id, running.id), eq(focusSessions.status, 'running')))
        .returning()
        .get() ?? null
    );
  });
}

/** The running focus, if any. */
export function getRunningFocus(db: AppDatabase): FocusSessionRow | undefined {
  return selectRunningFocus(db).get();
}

/** Live query: the running focus (zero or one row). */
export function selectRunningFocus(db: AppDatabase) {
  return db.select().from(focusSessions).where(eq(focusSessions.status, 'running')).limit(1);
}

/** Live query: the newest focus (running or finished), zero or one row. */
export function selectLatestFocus(db: AppDatabase) {
  return db.select().from(focusSessions).orderBy(desc(focusSessions.id)).limit(1);
}

/** Live query: every focus, newest first (the focus log). */
export function selectFocusSessions(db: AppDatabase) {
  return db.select().from(focusSessions).orderBy(desc(focusSessions.id));
}

/** Live query: every focus begun on a day, newest first. */
export function selectFocusOn(db: AppDatabase, day: DayKey) {
  return db.select().from(focusSessions).where(eq(focusSessions.day, day)).orderBy(desc(focusSessions.id));
}
