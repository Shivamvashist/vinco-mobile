/**
 * Every reward number for Labours and Decorations, in one place to tune (docs/REWARDS.md).
 * Kept modest: a Truce costs 50 denarii, a held day pays 5 and a conquered day 10.
 */
import { type DecorationId, TRUCES } from '@/features/campaign';

/**
 * What a claim pays: denarii into the purse, Gloria (glory points) into the record, and for a few
 * hard ones a Truce into the reserve.
 */
export type Reward = { denarii: number; gloria: number; truces?: number };

/** What a claim actually pays once the Truce cap is applied. */
export type ClaimPay = {
  denarii: number;
  gloria: number;
  /** Truces added to the reserve. */
  truces: number;
  /** Truces the reserve had no room for, paid as denarii instead (included in `denarii`). */
  trucesConverted: number;
};

export type LabourId =
  'selfie' | 'weight' | 'focus' | 'todos' | 'conquer' | 'holdWeek' | 'conquerWeek' | 'focusWeek' | 'wakeWeek';

/** Goals and pay (a Truce is worth TRUCES.priceDenarii, 50). Daily: 3 to 8 denarii, 10 to 25 Gloria. Weekly: 15 to 40 denarii, 50 to 120 Gloria. */
export const LABOUR_RULES = {
  selfie: { goal: 1, reward: { denarii: 3, gloria: 10 } },
  weight: { goal: 1, reward: { denarii: 3, gloria: 10 } },
  focus: { goal: 25, reward: { denarii: 5, gloria: 15 } },
  todos: { goal: 3, reward: { denarii: 4, gloria: 15 } },
  conquer: { goal: 1, reward: { denarii: 8, gloria: 25 } },
  holdWeek: { goal: 5, reward: { denarii: 30, gloria: 100 } },
  conquerWeek: { goal: 3, reward: { denarii: 20, gloria: 120, truces: 1 } },
  focusWeek: { goal: 180, reward: { denarii: 30, gloria: 100 } },
  wakeWeek: { goal: 5, reward: { denarii: 15, gloria: 50 } },
} as const satisfies Record<LabourId, { goal: number; reward: Reward }>;

/** Decorations pay once, forever: 10 to 100 denarii by how hard they are. */
export const DECORATION_REWARDS = {
  firstSeal: { denarii: 10, gloria: 30 },
  conqueror: { denarii: 20, gloria: 60 },
  proofKeeper: { denarii: 25, gloria: 80 },
  resurgo: { denarii: 30, gloria: 100 },
  oathKeeper: { denarii: 40, gloria: 120 },
  ironWeek: { denarii: 30, gloria: 150, truces: 1 },
  halfway: { denarii: 100, gloria: 300, truces: 1 },
} as const satisfies Record<DecorationId, Reward>;

/**
 * What a reward pays with this many Truces held: Truces only up to TRUCES.maxHeld, the rest
 * converted to their price in denarii, so a full reserve never wastes a reward.
 */
export function resolveClaimPay(reward: Reward, reserve: number): ClaimPay {
  const wanted = Math.max(0, Math.floor(reward.truces ?? 0));
  const room = Math.max(0, TRUCES.maxHeld - Math.max(0, Math.floor(reserve)));
  const truces = Math.min(wanted, room);
  const trucesConverted = wanted - truces;
  return {
    denarii: Math.max(0, Math.floor(reward.denarii)) + trucesConverted * TRUCES.priceDenarii,
    gloria: Math.max(0, Math.floor(reward.gloria)),
    truces,
    trucesConverted,
  };
}
