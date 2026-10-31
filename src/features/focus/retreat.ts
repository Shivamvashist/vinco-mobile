/**
 * Retreating from a focus before its end. A focus can run three hours and the phone must never
 * become a trap, so a retreat always exists, at a real cost: a Truce, else 50 denarii (a Truce
 * bought on the spot), else a 30-second stand-down. Retreating never pays. Pure.
 */
import { TRUCES } from '@/features/campaign';

import { FOCUS_RULES } from './focus';

/** How a retreat is paid for. */
export type RetreatPayment = 'truce' | 'denarii' | 'standDown';

/** The cheapest way out the user can afford: a Truce held, else denarii, else the stand-down. */
export function planRetreatPayment(truceReserve: number, denarii: number): RetreatPayment {
  if (Number.isFinite(truceReserve) && truceReserve >= 1) return 'truce';
  if (Number.isFinite(denarii) && denarii >= TRUCES.priceDenarii) return 'denarii';
  return 'standDown';
}

/** Retreats cost a Truce or denarii: warn before a focus begins when no Truce is held. */
export function shouldWarnNoTruce(truceReserve: number): boolean {
  return !(Number.isFinite(truceReserve) && truceReserve >= 1);
}

/**
 * The truces or ledger reason for one session's retreat. One per session, so several retreats on
 * one day never collide on (day, reason), and a session can never be charged twice.
 */
export function focusRetreatReason(sessionId: number): `focus_retreat_${number}` {
  return `focus_retreat_${Math.trunc(sessionId)}`;
}

export function isFocusRetreatReason(reason: string): boolean {
  return /^focus_retreat_\d+$/.test(reason);
}

/** Milliseconds left on a stand-down begun at `startedAtMs`; 0 once it is over. */
export function standDownLeftMs(startedAtMs: number, nowMs: number): number {
  const total = FOCUS_RULES.standDownSeconds * 1000;
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(nowMs)) return total;
  // A clock moved back restarts nothing and never adds time past the full stand-down.
  const elapsed = Math.max(0, nowMs - startedAtMs);
  return Math.max(0, total - elapsed);
}
