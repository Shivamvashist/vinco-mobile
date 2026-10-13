import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type DayKey, parseDayKey } from '@/lib/dates';

import { createPhoneStorage } from './phoneStorage';

/** One-time screens already shown, and how often the oath was played today. */
type NoticesState = {
  /** The break (first missed day of its run) whose "campaign lost" screen was shown. */
  acknowledgedLossDay: DayKey | null;
  /** Oath plays on one day (the oath can be heard OATH_PLAYS_PER_DAY times a day). */
  oathPlays: { day: DayKey | null; count: number };
};

type NoticesActions = {
  acknowledgeLoss: (day: DayKey) => void;
  /** Counts one oath play on a day (a new day starts again from one). */
  recordOathPlay: (day: DayKey) => void;
  /** Forgets every notice, for a fresh journey. */
  reset: () => void;
};

export type NoticesStore = NoticesState & NoticesActions;

/** Keeps a saved day only if it is a real day key. */
export function sanitizeNotices(saved: unknown): NoticesState {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  const day = value.acknowledgedLossDay;
  const plays = (
    value.oathPlays != null && typeof value.oathPlays === 'object' ? value.oathPlays : {}
  ) as Record<string, unknown>;
  const playsDay = typeof plays.day === 'string' && isDayKey(plays.day) ? plays.day : null;
  const count =
    typeof plays.count === 'number' && Number.isInteger(plays.count) ? Math.max(0, plays.count) : 0;
  return {
    acknowledgedLossDay: typeof day === 'string' && isDayKey(day) ? day : null,
    oathPlays: { day: playsDay, count: playsDay ? count : 0 },
  };
}

/** Oath plays already used on a day. */
export function oathPlaysOn(state: Pick<NoticesState, 'oathPlays'>, day: DayKey): number {
  return state.oathPlays.day === day ? state.oathPlays.count : 0;
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
      oathPlays: { day: null, count: 0 },
      recordOathPlay: (day) => set((state) => ({ oathPlays: { day, count: oathPlaysOn(state, day) + 1 } })),
      // Only ever moves forward (day keys sort as text): an older break never lowers it.
      acknowledgeLoss: (day) =>
        set((state) =>
          state.acknowledgedLossDay != null && state.acknowledgedLossDay >= day
            ? state
            : { acknowledgedLossDay: day },
        ),
      reset: () => set({ acknowledgedLossDay: null, oathPlays: { day: null, count: 0 } }),
    }),
    {
      name: 'vinco.notices',
      version: 1,
      storage: createPhoneStorage<NoticesState>(),
      partialize: ({ acknowledgedLossDay, oathPlays }) => ({ acknowledgedLossDay, oathPlays }),
      migrate: (saved) => sanitizeNotices(saved),
      merge: (saved, current) => ({ ...current, ...sanitizeNotices(saved) }),
    },
  ),
);
