import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPhoneStorage } from './phoneStorage';

/**
 * What the focus screens remember. Saved on the phone: only whether the rain sound is on (the
 * user's choice, off by default). For this app start only: the finished focus whose result the
 * user has already seen (claimed or dismissed), and whether a running focus was already reopened
 * at launch. The sessions themselves live in SQLite (focus_sessions).
 */
export type FocusUiState = {
  /** The id of the last finished focus the user has seen; its result no longer opens. */
  seenSessionId: number | null;
  /** A focus running at launch reopens its screen once per app start. */
  hasResumed: boolean;
  /** Soft rain plays on the running focus (the rain tile's toggle). */
  isRainSoundOn: boolean;
};

type FocusUiActions = {
  markSeen: (sessionId: number) => void;
  markResumed: () => void;
  setRainSound: (isOn: boolean) => void;
  reset: () => void;
};

export type FocusUiStore = FocusUiState & FocusUiActions;

type SavedFocusUi = Pick<FocusUiState, 'isRainSoundOn'>;

const INITIAL_FOCUS_UI: FocusUiState = { seenSessionId: null, hasResumed: false, isRainSoundOn: false };

/** Keeps only valid saved values; anything else falls back to the default (rain off). */
export function sanitizeFocusUi(saved: unknown): SavedFocusUi {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  return { isRainSoundOn: value.isRainSoundOn === true };
}

export const useFocusUiStore = create<FocusUiStore>()(
  persist(
    (set) => ({
      ...INITIAL_FOCUS_UI,
      markSeen: (sessionId) => set({ seenSessionId: sessionId }),
      markResumed: () => set({ hasResumed: true }),
      setRainSound: (isOn) => set({ isRainSoundOn: isOn === true }),
      reset: () => set(INITIAL_FOCUS_UI),
    }),
    {
      name: 'vinco.focus',
      version: 1,
      storage: createPhoneStorage<SavedFocusUi>(),
      partialize: ({ isRainSoundOn }) => ({ isRainSoundOn }),
      migrate: (saved) => sanitizeFocusUi(saved),
      merge: (saved, current) => ({ ...current, ...sanitizeFocusUi(saved) }),
    },
  ),
);
