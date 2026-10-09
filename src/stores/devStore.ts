import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPhoneStorage } from './phoneStorage';

/** Dev builds only: dev mode does nothing in a production build. */
export const IS_DEV_MODE_AVAILABLE = __DEV__;

/** Furthest the simulated clock can move ahead: far past any arc. */
export const MAX_DAY_OFFSET = 366;

/** Tools for testing on a phone. Saved, so a restart keeps the simulated day. */
type DevState = {
  isDevModeOn: boolean;
  /** Days the app's calendar runs ahead of the phone's clock. Only ever moves forward. */
  dayOffset: number;
};

type DevActions = {
  setDevModeOn: (isOn: boolean) => void;
  /** Moves the app's calendar one day ahead, up to MAX_DAY_OFFSET. */
  advanceDay: () => void;
  /** Back to the real clock. Only safe after a full reset: sealed future days would remain. */
  resetDayOffset: () => void;
};

export type DevStore = DevState & DevActions;

/** Keeps saved values only if they are valid. */
export function sanitizeDevState(saved: unknown): DevState {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  const offset = value.dayOffset;
  return {
    isDevModeOn: value.isDevModeOn === true,
    dayOffset:
      typeof offset === 'number' && Number.isInteger(offset) && offset >= 0
        ? Math.min(offset, MAX_DAY_OFFSET)
        : 0,
  };
}

export const useDevStore = create<DevStore>()(
  persist(
    (set) => ({
      isDevModeOn: false,
      dayOffset: 0,
      setDevModeOn: (isDevModeOn) => set({ isDevModeOn }),
      advanceDay: () => set((state) => ({ dayOffset: Math.min(state.dayOffset + 1, MAX_DAY_OFFSET) })),
      resetDayOffset: () => set({ dayOffset: 0 }),
    }),
    {
      name: 'vinco.dev',
      version: 1,
      storage: createPhoneStorage<DevState>(),
      partialize: ({ isDevModeOn, dayOffset }) => ({ isDevModeOn, dayOffset }),
      migrate: (saved) => sanitizeDevState(saved),
      merge: (saved, current) => ({ ...current, ...sanitizeDevState(saved) }),
    },
  ),
);

/** The day offset in effect: always 0 outside dev builds. */
export function selectDayOffset(state: DevStore): number {
  return IS_DEV_MODE_AVAILABLE ? state.dayOffset : 0;
}
