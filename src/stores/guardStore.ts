import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type AuroraSettings, DEFAULT_AURORA_SETTINGS, sanitizeAuroraSettings } from '@/features/aurora';
import {
  clampReelBudget,
  DEFAULT_GUARD_LEVEL,
  GUARD_RULES,
  type GuardLevel,
  isGuardLevel,
} from '@/features/guard';

import { createPhoneStorage } from './phoneStorage';

/**
 * The user's guard level, reel budget and Aurora alarm. Choices only: counts and alarms live in
 * the native modules once they ship (docs/GUARDIANS.md). Saved on the phone.
 */
export type GuardState = {
  level: GuardLevel;
  reelBudget: number;
  aurora: AuroraSettings;
};

type GuardActions = {
  setLevel: (level: GuardLevel) => void;
  setReelBudget: (budget: number) => void;
  updateAurora: (patch: Partial<AuroraSettings>) => void;
  reset: () => void;
};

export type GuardStore = GuardState & GuardActions;

export const DEFAULT_GUARD_STATE: GuardState = {
  level: DEFAULT_GUARD_LEVEL,
  reelBudget: GUARD_RULES.defaultReelBudget,
  aurora: DEFAULT_AURORA_SETTINGS,
};

/** Keeps only valid saved values; anything else falls back to the default. */
export function sanitizeGuardState(saved: unknown): GuardState {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  return {
    level: isGuardLevel(value.level) ? value.level : DEFAULT_GUARD_LEVEL,
    reelBudget: clampReelBudget(value.reelBudget),
    aurora: sanitizeAuroraSettings(value.aurora),
  };
}

export const useGuardStore = create<GuardStore>()(
  persist(
    (set) => ({
      ...DEFAULT_GUARD_STATE,
      setLevel: (level) => set({ level: isGuardLevel(level) ? level : DEFAULT_GUARD_LEVEL }),
      setReelBudget: (budget) => set({ reelBudget: clampReelBudget(budget) }),
      updateAurora: (patch) =>
        set((state) => ({ aurora: sanitizeAuroraSettings({ ...state.aurora, ...patch }) })),
      reset: () => set(DEFAULT_GUARD_STATE),
    }),
    {
      name: 'vinco.guard',
      version: 1,
      storage: createPhoneStorage<GuardState>(),
      partialize: ({ level, reelBudget, aurora }) => ({ level, reelBudget, aurora }),
      migrate: (saved) => sanitizeGuardState(saved),
      merge: (saved, current) => ({ ...current, ...sanitizeGuardState(saved) }),
    },
  ),
);
