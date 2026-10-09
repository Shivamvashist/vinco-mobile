import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type ArcLength, DEFAULT_ARC_LENGTH, isArcLength } from '@/features/arc';
import {
  DEFAULT_FULL_GOALS,
  DEFAULT_WAKE_MINUTES,
  fitToRange,
  FULL_GOAL_RANGES,
  type FullGoals,
  type TunableOrder,
  WAKE_TIME_RANGE,
} from '@/features/orders';

import { createPhoneStorage } from './phoneStorage';

/** The onboarding screens after the Rubicon, in order. */
export const ONBOARDING_STEPS = ['arc', 'orders', 'tone', 'oath', 'selfie'] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Choices made so far. Becomes an arc in the database when onboarding finishes. */
export type OnboardingDraft = {
  arcLength: ArcLength;
  fullGoals: FullGoals;
  /** Minutes after midnight. */
  wakeMinutes: number;
  /** The saved oath recording, or null if not recorded or skipped. */
  oathPath: string | null;
  /** Where to resume if the app closes mid-onboarding. Null until the Rubicon is crossed. */
  lastStep: OnboardingStep | null;
};

type OnboardingActions = {
  setArcLength: (length: ArcLength) => void;
  setFullGoal: (order: TunableOrder, value: number) => void;
  setWakeMinutes: (minutes: number) => void;
  setOathPath: (path: string | null) => void;
  setLastStep: (step: OnboardingStep) => void;
  /** Clears the draft once the arc is created. */
  reset: () => void;
};

export type OnboardingStore = OnboardingDraft & OnboardingActions;

export const DEFAULT_ONBOARDING_DRAFT: OnboardingDraft = {
  arcLength: DEFAULT_ARC_LENGTH,
  fullGoals: DEFAULT_FULL_GOALS,
  wakeMinutes: DEFAULT_WAKE_MINUTES,
  oathPath: null,
  lastStep: null,
};

const STORE_VERSION = 1;

/** Keeps only valid saved values; anything else falls back to the default. */
export function sanitizeOnboardingDraft(saved: unknown): OnboardingDraft {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  const goals = (
    value.fullGoals != null && typeof value.fullGoals === 'object' ? value.fullGoals : {}
  ) as Record<string, unknown>;
  return {
    arcLength: isArcLength(value.arcLength) ? value.arcLength : DEFAULT_ARC_LENGTH,
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

/** Onboarding choices in progress, saved on the phone so a closed app resumes where it left off. */
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...DEFAULT_ONBOARDING_DRAFT,
      setArcLength: (arcLength) => set({ arcLength }),
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
      partialize: ({ arcLength, fullGoals, wakeMinutes, oathPath, lastStep }) => ({
        arcLength,
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
