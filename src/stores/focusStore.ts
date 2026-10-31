import { create } from 'zustand';

/**
 * What the focus screens remember while the app is open, never saved: the finished focus whose
 * result the user has already seen (claimed or dismissed), and whether a running focus was already
 * reopened at launch. The sessions themselves live in SQLite (focus_sessions).
 */
export type FocusUiState = {
  /** The id of the last finished focus the user has seen; its result no longer opens. */
  seenSessionId: number | null;
  /** A focus running at launch reopens its screen once per app start. */
  hasResumed: boolean;
};

type FocusUiActions = {
  markSeen: (sessionId: number) => void;
  markResumed: () => void;
  reset: () => void;
};

export type FocusUiStore = FocusUiState & FocusUiActions;

const INITIAL_FOCUS_UI: FocusUiState = { seenSessionId: null, hasResumed: false };

export const useFocusUiStore = create<FocusUiStore>()((set) => ({
  ...INITIAL_FOCUS_UI,
  markSeen: (sessionId) => set({ seenSessionId: sessionId }),
  markResumed: () => set({ hasResumed: true }),
  reset: () => set(INITIAL_FOCUS_UI),
}));
