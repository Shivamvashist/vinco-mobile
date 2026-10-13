import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type ArcKind, type ArcLength, DEFAULT_ARC_LENGTH, isArcKind, isArcLength } from '@/features/arc';
import {
  type CustomOrderDraft,
  DEFAULT_FULL_GOALS,
  DEFAULT_WAKE_MINUTES,
  fitToRange,
  FULL_GOAL_RANGES,
  type FullGoals,
  type TunableOrder,
  normalizeCustomOrder,
  validateCustomOrder,
  WAKE_TIME_RANGE,
} from '@/features/orders';

import { createPhoneStorage } from './phoneStorage';

/**
 * The onboarding screens after the Rubicon. Everyone starts on "plan" (your orders); "arc" and
 * "orders" (campaign length and Vinco's four) only come when the user chooses a campaign.
 */
export const ONBOARDING_STEPS = ['plan', 'arc', 'orders', 'tone', 'oath', 'selfie'] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Steps taken on each path, in order. */
const PATH_STEPS: Record<ArcKind, readonly OnboardingStep[]> = {
  ludus: ['plan', 'tone', 'oath', 'selfie'],
  campaign: ['plan', 'arc', 'orders', 'tone', 'oath', 'selfie'],
};

/** Where a step sits on the user's path: "II of IV" without a campaign, "II of VI" with one. */
export function getStepPosition(step: OnboardingStep, kind: ArcKind): { step: number; total: number } {
  const steps = PATH_STEPS[kind];
  return { step: Math.max(1, steps.indexOf(step) + 1), total: steps.length };
}

/** Vinco's orders offered on the first step when there's no campaign. */
export const SUGGESTED_ORDERS = ['water', 'workout'] as const;

export type SuggestedOrder = (typeof SUGGESTED_ORDERS)[number];

/** Choices made so far. Becomes an arc in the database when onboarding finishes. */
export type OnboardingDraft = {
  /** Free training (the 'ludus' kind: the user's own plan) unless a campaign is chosen. */
  arcKind: ArcKind;
  arcLength: ArcLength;
  /** Vinco's suggested orders the user added (free training; a campaign has all four). */
  picks: SuggestedOrder[];
  /** The user's own orders, saved when onboarding finishes. */
  ownOrders: CustomOrderDraft[];
  fullGoals: FullGoals;
  /** Minutes after midnight. */
  wakeMinutes: number;
  /** The saved oath recording, or null if not recorded or skipped. */
  oathPath: string | null;
  /** Where to resume if the app closes mid-onboarding. Null until the Rubicon is crossed. */
  lastStep: OnboardingStep | null;
};

type OnboardingActions = {
  /** Picks a campaign of this length. */
  setArcLength: (length: ArcLength) => void;
  /** Goes with the user's own plan, no campaign (the length stays, for if they switch back). */
  chooseLudus: () => void;
  togglePick: (order: SuggestedOrder) => void;
  /** Adds an own order. Returns null when added, or why it was refused. */
  addOwnOrder: (draft: CustomOrderDraft) => ReturnType<typeof validateCustomOrder>;
  removeOwnOrder: (index: number) => void;
  setFullGoal: (order: TunableOrder, value: number) => void;
  setWakeMinutes: (minutes: number) => void;
  setOathPath: (path: string | null) => void;
  setLastStep: (step: OnboardingStep) => void;
  /** Clears the draft once the arc is created. */
  reset: () => void;
};

export type OnboardingStore = OnboardingDraft & OnboardingActions;

export const DEFAULT_ONBOARDING_DRAFT: OnboardingDraft = {
  arcKind: 'ludus',
  arcLength: DEFAULT_ARC_LENGTH,
  picks: [],
  ownOrders: [],
  fullGoals: DEFAULT_FULL_GOALS,
  wakeMinutes: DEFAULT_WAKE_MINUTES,
  oathPath: null,
  lastStep: null,
};

const STORE_VERSION = 2;

/** Keeps only valid saved values; anything else falls back to the default. */
export function sanitizeOnboardingDraft(saved: unknown): OnboardingDraft {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  const goals = (
    value.fullGoals != null && typeof value.fullGoals === 'object' ? value.fullGoals : {}
  ) as Record<string, unknown>;
  return {
    arcKind: isArcKind(value.arcKind) ? value.arcKind : DEFAULT_ONBOARDING_DRAFT.arcKind,
    arcLength: isArcLength(value.arcLength) ? value.arcLength : DEFAULT_ARC_LENGTH,
    picks: SUGGESTED_ORDERS.filter((order) => Array.isArray(value.picks) && value.picks.includes(order)),
    ownOrders: sanitizeOwnOrders(value.ownOrders),
    fullGoals: {
      water: fitToRange(goals.water, FULL_GOAL_RANGES.water, DEFAULT_FULL_GOALS.water),
      meal: fitToRange(goals.meal, FULL_GOAL_RANGES.meal, DEFAULT_FULL_GOALS.meal),
      workout: fitToRange(goals.workout, FULL_GOAL_RANGES.workout, DEFAULT_FULL_GOALS.workout),
    },
    wakeMinutes: fitToRange(value.wakeMinutes, WAKE_TIME_RANGE, DEFAULT_WAKE_MINUTES),
    oathPath: typeof value.oathPath === 'string' && value.oathPath.length > 0 ? value.oathPath : null,
    lastStep: (ONBOARDING_STEPS as readonly unknown[]).includes(value.lastStep)
      ? (value.lastStep as OnboardingStep)
      : null,
  };
}

/** Saved own orders that still validate, tidied, never more than the limit. */
function sanitizeOwnOrders(saved: unknown): CustomOrderDraft[] {
  if (!Array.isArray(saved)) return [];
  const clean: CustomOrderDraft[] = [];
  for (const item of saved as unknown[]) {
    if (item == null || typeof item !== 'object') continue;
    const draft = item as Record<string, unknown>;
    const candidate = {
      name: typeof draft.name === 'string' ? draft.name : '',
      unit: typeof draft.unit === 'string' ? draft.unit : '',
      min: typeof draft.min === 'number' ? draft.min : Number.NaN,
      full: typeof draft.full === 'number' ? draft.full : Number.NaN,
    };
    if (validateCustomOrder(candidate, clean.length) === null) clean.push(normalizeCustomOrder(candidate));
  }
  return clean;
}

/** Onboarding choices in progress, saved on the phone so a closed app resumes where it left off. */
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_ONBOARDING_DRAFT,
      setArcLength: (arcLength) => set({ arcLength, arcKind: 'campaign' }),
      chooseLudus: () => set({ arcKind: 'ludus' }),
      togglePick: (order) =>
        set((state) => ({
          picks: state.picks.includes(order)
            ? state.picks.filter((pick) => pick !== order)
            : SUGGESTED_ORDERS.filter((pick) => pick === order || state.picks.includes(pick)),
        })),
      addOwnOrder: (draft) => {
        const error = validateCustomOrder(draft, get().ownOrders.length);
        if (error === null)
          set((state) => ({ ownOrders: [...state.ownOrders, normalizeCustomOrder(draft)] }));
        return error;
      },
      removeOwnOrder: (index) =>
        set((state) => ({ ownOrders: state.ownOrders.filter((_order, at) => at !== index) })),
      setFullGoal: (order, value) =>
        set((state) => ({
          fullGoals: {
            ...state.fullGoals,
            [order]: fitToRange(value, FULL_GOAL_RANGES[order], state.fullGoals[order]),
          },
        })),
      setWakeMinutes: (minutes) =>
        set((state) => ({ wakeMinutes: fitToRange(minutes, WAKE_TIME_RANGE, state.wakeMinutes) })),
      setOathPath: (oathPath) => set({ oathPath }),
      setLastStep: (lastStep) => set({ lastStep }),
      reset: () => set(DEFAULT_ONBOARDING_DRAFT),
    }),
    {
      name: 'vinco.onboarding',
      version: STORE_VERSION,
      storage: createPhoneStorage<OnboardingDraft>(),
      partialize: ({ arcKind, arcLength, picks, ownOrders, fullGoals, wakeMinutes, oathPath, lastStep }) => ({
        arcKind,
        arcLength,
        picks,
        ownOrders,
        fullGoals,
        wakeMinutes,
        oathPath,
        lastStep,
      }),
      migrate: (saved) => sanitizeOnboardingDraft(saved),
      merge: (saved, current) => ({ ...current, ...sanitizeOnboardingDraft(saved) }),
    },
  ),
);
