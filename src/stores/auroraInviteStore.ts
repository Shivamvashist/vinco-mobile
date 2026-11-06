import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPhoneStorage } from './phoneStorage';

/**
 * Today's "set up Aurora" invite. Closed for good once the user says "Not now", or once Aurora
 * has been turned on (a user who later turns it off did so on purpose). Saved on the phone.
 */
export type AuroraInviteState = { isClosed: boolean };

type AuroraInviteActions = {
  close: () => void;
  /** Shows the invite again, for a fresh start (dev reset of everything). */
  reset: () => void;
};

export type AuroraInviteStore = AuroraInviteState & AuroraInviteActions;

/** Keeps only a valid saved value; anything else shows the invite. */
export function sanitizeAuroraInvite(saved: unknown): AuroraInviteState {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  return { isClosed: value.isClosed === true };
}

export const useAuroraInviteStore = create<AuroraInviteStore>()(
  persist(
    (set) => ({
      isClosed: false,
      close: () => set({ isClosed: true }),
      reset: () => set({ isClosed: false }),
    }),
    {
      name: 'vinco.auroraInvite',
      version: 1,
      storage: createPhoneStorage<AuroraInviteState>(),
      partialize: ({ isClosed }) => ({ isClosed }),
      migrate: (saved) => sanitizeAuroraInvite(saved),
      merge: (saved, current) => ({ ...current, ...sanitizeAuroraInvite(saved) }),
    },
  ),
);
