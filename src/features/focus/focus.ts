/**
 * Focus ("Acies", the battle line): a timed stretch with a guard on the phone, paid in denarii
 * when held to the end. Pure: no React, no SQLite, no clock (pass `now` in).
 * Product spec: docs/TODAY-AND-FOCUS.md section 4.
 */
import { FOCUS_REASONS, type FocusReason } from '@/features/campaign';

/** How hard the phone is guarded during a focus. */
export const FOCUS_GUARDS = ['custos', 'imperium', 'silentium'] as const;

/** custos: marked apps allowed for a few minutes in all. imperium: marked apps blocked. silentium: all but calls, messages and Vinco. */
export type FocusGuard = (typeof FOCUS_GUARDS)[number];

export type FocusStatus = 'running' | 'completed' | 'abandoned';

/** What a saved session needs for the rules here (a database row fits). */
export type FocusSessionFacts = {
  minutes: number;
  guard: FocusGuard;
  /** ISO timestamps. */
  startedAt: string;
  endsAt: string;
  status: FocusStatus;
  reward: number;
};

/** Where a session stands now. 'due': time is up, not yet settled (paid). */
export type FocusState = 'running' | 'due' | 'completed' | 'abandoned';

/** Why a finished session paid what it did. */
export type FocusOutcome = 'paid' | 'tooShort' | 'dailyLimit' | 'retreated';

export const FOCUS_RULES = {
  minMinutes: 5,
  maxMinutes: 180,
  stepMinutes: 5,
  defaultMinutes: 25,
  presets: [15, 25, 45, 60, 90],
  /** Denarii per minute held. */
  rates: { custos: 0.2, imperium: 0.3, silentium: 0.4 },
  /** Shorter sessions pay nothing. */
  minRewardMinutes: 10,
  /** Minutes past this don't add to the pay. */
  maxCountedMinutes: 120,
  /** Rewarded sessions a day: one ledger reason each (focus_1 to focus_3). */
  maxRewardedPerDay: 3,
  /** Custos: marked apps are allowed this long in total during a focus. */
  custosAllowanceMinutes: 5,
  /** "Retreat" needs a hold this long. */
  giveUpHoldMs: 1500,
  /**
   * How far the phone's clock may run ahead of the time measured on the phone (a monotonic clock)
   * before the measured time is trusted instead: small drift is fine, a jump is not.
   */
  clockToleranceMs: 2000,
} as const satisfies {
  presets: readonly number[];
  rates: Record<FocusGuard, number>;
} & Record<string, unknown>;

/** Identifies the "Focus held" notification. Never starts with the reminders' prefix. */
export const FOCUS_NOTIFICATION_ID_PREFIX = 'vinco.focus.';

export const DEFAULT_FOCUS_GUARD: FocusGuard = 'imperium';

export function isFocusGuard(value: unknown): value is FocusGuard {
  return typeof value === 'string' && (FOCUS_GUARDS as readonly string[]).includes(value);
}

/** Minutes kept between 5 and 180 and on a 5-minute step. Bad values give the default. */
export function clampFocusMinutes(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return FOCUS_RULES.defaultMinutes;
  const { minMinutes, maxMinutes, stepMinutes } = FOCUS_RULES;
  const stepped = Math.round(value / stepMinutes) * stepMinutes;
  return Math.min(maxMinutes, Math.max(minMinutes, stepped));
}

/**
 * What holding a focus to the end pays: minutes (at most 120) times the guard's rate, rounded.
 * Under 10 minutes pays nothing. Worked in hundredths so 25 x 0.3 is exactly 7.5 (pays 8).
 */
export function focusReward(minutes: number, guard: FocusGuard): number {
  if (!Number.isFinite(minutes) || minutes < FOCUS_RULES.minRewardMinutes) return 0;
  const counted = Math.min(minutes, FOCUS_RULES.maxCountedMinutes);
  const hundredths = Math.round(FOCUS_RULES.rates[guard] * 100);
  return Math.round((counted * hundredths) / 100);
}

/** The first focus reason not yet paid today, or null when all three are used. */
export function nextFocusReason(usedReasons: readonly string[]): FocusReason | null {
  return FOCUS_REASONS.find((reason) => !usedReasons.includes(reason)) ?? null;
}

/** What a new focus would pay now, given how many rewarded sessions today already has. */
export function expectedFocusReward(minutes: number, guard: FocusGuard, rewardedToday: number): number {
  return rewardedToday >= FOCUS_RULES.maxRewardedPerDay ? 0 : focusReward(minutes, guard);
}

/** When a focus started now would end. */
export function focusEndsAt(startedAt: Date, minutes: number): Date {
  return new Date(startedAt.getTime() + clampFocusMinutes(minutes) * 60_000);
}

/**
 * Where a session stands at `now`. It is due only once `now` reaches its end. A clock set back
 * before the start reads as running (it can't complete), and an unreadable date never completes.
 */
export function getFocusState(
  session: Pick<FocusSessionFacts, 'startedAt' | 'endsAt' | 'status'>,
  now: Date,
): FocusState {
  if (session.status !== 'running') return session.status;
  const startMs = Date.parse(session.startedAt);
  const endMs = Date.parse(session.endsAt);
  const nowMs = now.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || !Number.isFinite(nowMs)) return 'running';
  if (nowMs < startMs) return 'running';
  return nowMs >= endMs ? 'due' : 'running';
}

/** Milliseconds left, 0 once due. */
export function remainingMs(session: Pick<FocusSessionFacts, 'endsAt'>, now: Date): number {
  const endMs = Date.parse(session.endsAt);
  if (!Number.isFinite(endMs)) return 0;
  return Math.max(0, endMs - now.getTime());
}

/** Share of the session still to go, 1 at the start and 0 at the end. */
export function remainingShare(session: Pick<FocusSessionFacts, 'startedAt' | 'endsAt'>, now: Date): number {
  const startMs = Date.parse(session.startedAt);
  const endMs = Date.parse(session.endsAt);
  const total = endMs - startMs;
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.min(1, Math.max(0, (endMs - now.getTime()) / total));
}

/** A pair of readings taken at the same moment: the wall clock and the phone's monotonic clock. */
export type ClockAnchor = { wallMs: number; monotonicMs: number };

/**
 * The time to judge a focus by. While the app has a trusted anchor (taken when the focus began,
 * kept while the app stays open), the wall clock may not run ahead of the time actually measured
 * since then, so moving the clock forward can't finish a focus early. With no anchor (the app was
 * closed or sent away), the wall clock is all there is. Never later than the wall clock.
 */
export function getTrustedNow(wallNow: Date, anchor: ClockAnchor | null, monotonicNow: number): Date {
  if (!anchor || !Number.isFinite(monotonicNow) || monotonicNow < anchor.monotonicMs) return wallNow;
  const measured = anchor.wallMs + (monotonicNow - anchor.monotonicMs) + FOCUS_RULES.clockToleranceMs;
  return measured < wallNow.getTime() ? new Date(measured) : wallNow;
}

/** Why a finished session paid what it did. Null while it runs. */
export function getFocusOutcome(
  session: Pick<FocusSessionFacts, 'status' | 'reward' | 'minutes'>,
): FocusOutcome | null {
  if (session.status === 'running') return null;
  if (session.status === 'abandoned') return 'retreated';
  if (session.reward > 0) return 'paid';
  return session.minutes < FOCUS_RULES.minRewardMinutes ? 'tooShort' : 'dailyLimit';
}

/** Minutes the phone allows marked apps during a focus with this guard. */
export function focusAllowanceMinutes(guard: FocusGuard): number {
  return guard === 'custos' ? FOCUS_RULES.custosAllowanceMinutes : 0;
}

/** "mm:ss" (or "h:mm:ss" from an hour), counting whole seconds up so 0:00 shows only at the end. */
export function formatFocusClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil((Number.isFinite(ms) ? ms : 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
  return `${String(minutes).padStart(2, '0')}:${ss}`;
}
