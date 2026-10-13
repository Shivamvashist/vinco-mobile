/**
 * The contract the native Aurora module (modules/aurora, Kotlin) will implement: exact alarms
 * through AlarmManager, a full-screen alarm over the lock screen, re-scheduling after a reboot.
 * The app runs with the stub below until then. See docs/GUARDIANS.md.
 */
export type AuroraBridge = {
  /** False until the native module ships. */
  isSupported: boolean;
  /** Android 12+ asks the user to allow exact alarms. */
  canScheduleExact: () => Promise<boolean>;
  openExactAlarmSettings: () => Promise<void>;
  /** Schedules the next ring (replacing any earlier one). */
  schedule: (ringAt: Date) => Promise<void>;
  cancel: () => Promise<void>;
};

export const unsupportedAuroraBridge: AuroraBridge = {
  isSupported: false,
  canScheduleExact: async () => false,
  openExactAlarmSettings: async () => undefined,
  schedule: async () => undefined,
  cancel: async () => undefined,
};

/** The bridge the app uses. Swap for the native module's implementation when it ships. */
export const auroraBridge: AuroraBridge = unsupportedAuroraBridge;
