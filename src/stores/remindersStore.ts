import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  clampEveningMinutes,
  DEFAULT_REMINDER_SETTINGS,
  isReminderKind,
  type ReminderKind,
  type ReminderSettings,
  sanitizeReminderSettings,
} from '@/features/notifications';

import { createPhoneStorage } from './phoneStorage';

/** Longest push token kept. Expo tokens are about 40 characters; anything far longer is junk. */
const MAX_PUSH_TOKEN_LENGTH = 200;

/**
 * The user's reminder choices, whether Vinco has asked for the notification permission yet, and the
 * Expo push token (kept on the phone only until the app is wired to vinco-backend). Saved on the phone.
 */
export type RemindersState = ReminderSettings & {
  /** The permission was asked once already, so it is never asked unprompted again. */
  hasAskedPermission: boolean;
  /** This install's Expo push token, or null. Not sent anywhere yet (docs/NOTIFICATIONS.md). */
  pushToken: string | null;
};

type RemindersActions = {
  setOn: (isOn: boolean) => void;
  setKind: (kind: ReminderKind, isOn: boolean) => void;
  setEveningMinutes: (minutes: number) => void;
  markPermissionAsked: () => void;
  setPushToken: (token: string | null) => void;
};

export type RemindersStore = RemindersState & RemindersActions;

export const DEFAULT_REMINDERS_STATE: RemindersState = {
  ...DEFAULT_REMINDER_SETTINGS,
  hasAskedPermission: false,
  pushToken: null,
};

/** Keeps only valid saved values; anything else falls back to the default. */
export function sanitizeReminders(saved: unknown): RemindersState {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  return {
    ...sanitizeReminderSettings(value),
    hasAskedPermission: value.hasAskedPermission === true,
    pushToken: sanitizePushToken(value.pushToken),
  };
}

/** The reminder settings alone, for the planner. */
export function selectReminderSettings(state: RemindersState): ReminderSettings {
  return { isOn: state.isOn, kinds: state.kinds, eveningMinutes: state.eveningMinutes };
}

export const useRemindersStore = create<RemindersStore>()(
  persist(
    (set) => ({
      ...DEFAULT_REMINDERS_STATE,
      setOn: (isOn) => set({ isOn: isOn === true }),
      setKind: (kind, isOn) => {
        if (!isReminderKind(kind)) return;
        set((state) => ({ kinds: { ...state.kinds, [kind]: isOn === true } }));
      },
      setEveningMinutes: (minutes) => set({ eveningMinutes: clampEveningMinutes(minutes) }),
      markPermissionAsked: () => set({ hasAskedPermission: true }),
      setPushToken: (token) => set({ pushToken: sanitizePushToken(token) }),
    }),
    {
      name: 'vinco.reminders',
      version: 1,
      storage: createPhoneStorage<RemindersState>(),
      partialize: ({ isOn, kinds, eveningMinutes, hasAskedPermission, pushToken }) => ({
        isOn,
        kinds,
        eveningMinutes,
        hasAskedPermission,
        pushToken,
      }),
      migrate: (saved) => sanitizeReminders(saved),
      merge: (saved, current) => ({ ...current, ...sanitizeReminders(saved) }),
    },
  ),
);

function sanitizePushToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const token = value.trim();
  return token.length > 0 && token.length <= MAX_PUSH_TOKEN_LENGTH ? token : null;
}
