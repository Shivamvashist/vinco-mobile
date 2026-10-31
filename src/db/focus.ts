import { and, desc, eq, inArray } from 'drizzle-orm';

import { FOCUS_REASONS } from '@/features/campaign';
import {
  clampFocusMinutes,
  focusEndsAt,
  type FocusGuard,
  focusReward,
  getFocusState,
  isFocusGuard,
  nextFocusReason,
} from '@/features/focus';
import type { DayKey } from '@/lib/dates';

import { type AppDatabase, nowIso } from './database';
import { type FocusSessionRow, focusSessions, ledger } from './schema';

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

/** Live query: every focus begun on a day, newest first. */
export function selectFocusOn(db: AppDatabase, day: DayKey) {
  return db.select().from(focusSessions).where(eq(focusSessions.day, day)).orderBy(desc(focusSessions.id));
}
