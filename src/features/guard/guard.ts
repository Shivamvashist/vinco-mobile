/**
 * The four guard levels: how much Vinco does about the scroll. Each includes the ones before it.
 * Counting and blocking need the native Vigil module (docs/GUARDIANS.md); the rules live here.
 */
export type GuardLevel = 'pax' | 'vigil' | 'guard' | 'imperium';

export const GUARD_LEVELS: readonly GuardLevel[] = ['pax', 'vigil', 'guard', 'imperium'];

export const DEFAULT_GUARD_LEVEL: GuardLevel = 'pax';

/** The release that brings each level. */
export const GUARD_LEVEL_SHIPS: Record<GuardLevel, '1.0' | '1.1' | '1.2'> = {
  pax: '1.0',
  vigil: '1.0',
  guard: '1.1',
  imperium: '1.2',
};

export const GUARD_RULES = {
  /** Reels a day before the budget is passed. */
  defaultReelBudget: 30,
  reelBudgetRange: { min: 5, max: 200, step: 5 },
  /** A milestone card every this many reels (Vigil and up). */
  milestoneEvery: 25,
  /** Tributum: the first extension's price; it doubles each time that day. */
  tributumBase: 15,
  tributumReels: 10,
  tributumMaxPerDay: 3,
  /** Clementia: minutes unlocked once every order holds (Imperium). */
  clementiaMinutes: 10,
  /** Turning Imperium off waits this long. */
  imperiumCoolOffHours: 24,
} as const;

export function isGuardLevel(value: unknown): value is GuardLevel {
  return typeof value === 'string' && (GUARD_LEVELS as readonly string[]).includes(value);
}

/** A reel budget kept in range and on a step. */
export function clampReelBudget(value: unknown): number {
  const { min, max, step } = GUARD_RULES.reelBudgetRange;
  if (typeof value !== 'number' || !Number.isFinite(value)) return GUARD_RULES.defaultReelBudget;
  return Math.min(max, Math.max(min, Math.round(value / step) * step));
}

/** Whether a level includes another (Imperium includes the Vigil's badge). */
export function levelIncludes(level: GuardLevel, feature: GuardLevel): boolean {
  return GUARD_LEVELS.indexOf(level) >= GUARD_LEVELS.indexOf(feature);
}

/** The milestone just reached at this count (25, 50...), or null. Vigil level and up. */
export function getReelMilestone(count: number, every: number = GUARD_RULES.milestoneEvery): number | null {
  if (!Number.isInteger(count) || count <= 0 || every <= 0) return null;
  return count % every === 0 ? count : null;
}

/**
 * The price of the next Tributum (10 more reels past the budget) after `paidToday` extensions,
 * or null when the day's three are used. 15, 30, 60.
 */
export function getTributumPrice(paidToday: number): number | null {
  const paid = Math.max(0, Math.floor(paidToday));
  if (paid >= GUARD_RULES.tributumMaxPerDay) return null;
  return GUARD_RULES.tributumBase * 2 ** paid;
}

/** Reels allowed today: the budget plus every Tributum paid. */
export function getReelAllowance(budget: number, paidToday: number): number {
  const paid = Math.min(GUARD_RULES.tributumMaxPerDay, Math.max(0, Math.floor(paidToday)));
  return clampReelBudget(budget) + paid * GUARD_RULES.tributumReels;
}

export type ImperiumGate =
  | { state: 'open' }
  /** Over the limit. Clementia is offered when every order holds and it isn't used yet. */
  | { state: 'locked'; canUseClementia: boolean };

/** Whether Imperium lets a marked app open right now. */
export function getImperiumGate(input: {
  reelsToday: number;
  allowance: number;
  areAllOrdersHeld: boolean;
  hasUsedClementiaToday: boolean;
}): ImperiumGate {
  if (input.reelsToday < input.allowance) return { state: 'open' };
  return { state: 'locked', canUseClementia: input.areAllOrdersHeld && !input.hasUsedClementiaToday };
}
