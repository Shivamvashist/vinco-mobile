import { clampReelBudget, type GuardLevel, levelIncludes } from './guard';

/**
 * The reel pass: 12 more reels over today's budget, bought with denarii only (never real money).
 * At most three a day; they reset at midnight with the count. Mirrored in modules/vigil
 * VigilReelPolicy.kt (keep the two in step). See docs/GUARDIANS.md "The reel counter".
 */
export const REEL_PASS = {
  price: 20,
  reels: 12,
  maxPerDay: 3,
} as const;

/**
 * The ledger reason of a day's passes: one per pass, so (day, reason) stays unique and a fourth
 * can never be written. The amount is the price, negative.
 */
export type ReelPassReason = 'reel_pass_1' | 'reel_pass_2' | 'reel_pass_3';

export const REEL_PASS_REASONS: readonly ReelPassReason[] = ['reel_pass_1', 'reel_pass_2', 'reel_pass_3'];

export function isReelPassReason(reason: unknown): reason is ReelPassReason {
  return typeof reason === 'string' && (REEL_PASS_REASONS as readonly string[]).includes(reason);
}

/** Passes used, from a day's ledger reasons (repeats and other reasons ignored). */
export function countReelPasses(reasons: Iterable<string>): number {
  const seen = new Set<string>();
  for (const reason of reasons) if (isReelPassReason(reason)) seen.add(reason);
  return seen.size;
}

/** A pass count kept whole and between 0 and the daily most. */
export function clampReelPasses(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(REEL_PASS.maxPerDay, Math.max(0, Math.floor(value)));
}

/** The reason for the next pass after `used`, or null when the day's three are used. */
export function nextReelPassReason(used: number): ReelPassReason | null {
  return REEL_PASS_REASONS[clampReelPasses(used)] ?? null;
}

export type ReelPassCheck = 'ok' | 'cannotAfford' | 'dailyLimit';

/** Whether a pass can be bought now, and if not, why. Checked again inside the purchase. */
export function checkReelPass(balance: number, used: number): ReelPassCheck {
  if (clampReelPasses(used) >= REEL_PASS.maxPerDay) return 'dailyLimit';
  if (!Number.isFinite(balance) || balance < REEL_PASS.price) return 'cannotAfford';
  return 'ok';
}

/** Denarii still needed for a pass (0 when it is affordable). */
export function reelPassShort(balance: number): number {
  const held = Number.isFinite(balance) ? Math.max(0, Math.floor(balance)) : 0;
  return Math.max(0, REEL_PASS.price - held);
}

/** Reels allowed today: the budget plus 12 for every pass used today. */
export function getReelAllowanceWithPasses(budget: number, passes: number): number {
  return clampReelBudget(budget) + clampReelPasses(passes) * REEL_PASS.reels;
}

/**
 * How the blocking card behaves past the allowance: at Vigil it can be closed; at Guard and
 * Imperium only "Leave" or a pass. Pax never blocks (it only counts).
 */
export type ReelBlockMode = 'closable' | 'firm';

export function getReelBlockMode(level: GuardLevel): ReelBlockMode | null {
  if (!levelIncludes(level, 'vigil')) return null;
  return levelIncludes(level, 'guard') ? 'firm' : 'closable';
}

/** Whether a counted reel brings up the blocking card: past the allowance, Vigil and up. */
export function isReelBlocked(count: number, allowance: number, level: GuardLevel): boolean {
  return getReelBlockMode(level) != null && Number.isFinite(count) && count > allowance;
}
