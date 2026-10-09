import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type DayKey, parseDayKey } from '@/lib/dates';

import { createPhoneStorage } from './phoneStorage';

/** One-time screens already shown, so they never show twice. */
type NoticesState = {
  /** The missed day whose "campaign lost" screen was shown. */
  acknowledgedLossDay: DayKey | null;
};

type NoticesActions = {
  acknowledgeLoss: (day: DayKey) => void;
  /** Forgets every notice, for a fresh journey. */
  reset: () => void;
};

export type NoticesStore = NoticesState & NoticesActions;

/** Keeps a saved day only if it is a real day key. */
export function sanitizeNotices(saved: unknown): NoticesState {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  const day = value.acknowledgedLossDay;
  return { acknowledgedLossDay: typeof day === 'string' && isDayKey(day) ? day : null };
}

function isDayKey(value: string): boolean {
  try {
    parseDayKey(value);
    return true;
  } catch {
    return false;
  }
}

export const useNoticesStore = create<NoticesStore>()(
  persist(
    (set) => ({
      acknowledgedLossDay: null,
      // Only ever moves forward (day keys sort as text): an older break never lowers it.
      acknowledgeLoss: (day) =>
        set((state) =>
          state.acknowledgedLossDay != null && state.acknowledgedLossDay >= day
            ? state
            : { acknowledgedLossDay: day },
        ),
      reset: () => set({ acknowledgedLossDay: null }),
    }),
    {
      name: 'vinco.notices',
      version: 1,
      storage: createPhoneStorage<NoticesState>(),
      partialize: ({ acknowledgedLossDay }) => ({ acknowledgedLossDay }),
      migrate: (saved) => sanitizeNotices(saved),
      merge: (saved, current) => ({ ...current, ...sanitizeNotices(saved) }),
    },
  ),
);
