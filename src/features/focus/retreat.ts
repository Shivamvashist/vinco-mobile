/**
 * Ending a focus before its end ("retreat"). A retreat spends one Truce and pays nothing. With no
 * Truce held the focus can't be ended early: the user can buy one (the Forum's rules: at most 3
 * held, one bought a day), or the focus runs to its end. Pure.
 * Product spec: docs/TODAY-AND-FOCUS.md section 4.
 */

/** A retreat needs one Truce held. */
export function canRetreat(truceReserve: number): boolean {
  return Number.isFinite(truceReserve) && truceReserve >= 1;
}

/** Before a focus begins with no Truce held, say it can't be ended early. */
export function shouldWarnNoTruce(truceReserve: number): boolean {
  return !canRetreat(truceReserve);
}

/**
 * The truces reason for one session's retreat. One per session, so several retreats on one day
 * never collide on (day, reason), and a session can never be charged twice. Ledger rows with this
 * reason exist from before 1 Nov 2026, when a retreat could cost 50 denarii.
 */
export function focusRetreatReason(sessionId: number): `focus_retreat_${number}` {
  return `focus_retreat_${Math.trunc(sessionId)}`;
}

export function isFocusRetreatReason(reason: string): boolean {
  return /^focus_retreat_\d+$/.test(reason);
}
