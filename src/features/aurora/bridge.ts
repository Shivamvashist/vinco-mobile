import { auroraNativeModule, type AuroraNativeModule } from '../../../modules/aurora';

/** The text the alarm's notification shows, in the user's tone. Kept by the phone for later rings. */
export type AuroraNotice = {
  channelName: string;
  title: string;
  body: string;
  /** The notification's one button: it opens the ring screen (no snooze, no silent stop). */
  action: string;
  timedOutTitle: string;
  timedOutBody: string;
};

/** The repeat rule sent with a ring, so the phone sets the next one itself after a ring or reboot. */
export type AuroraRepeat = { minutes: number; daysMask: number };

/**
 * The contract the native Aurora module (modules/aurora, Kotlin) implements: exact alarms
 * through AlarmManager, a full-screen alarm over the lock screen, re-scheduling after a reboot.
 * Expo Go, iOS and tests get the unsupported stub. See docs/GUARDIANS.md.
 */
export type AuroraBridge = {
  /** False in Expo Go (no native module): screens show the preview notice. */
  isSupported: boolean;
  /** Android 12+ asks the user to allow exact alarms. Without it, the ring may come late. */
  canScheduleExact: () => Promise<boolean>;
  openExactAlarmSettings: () => Promise<void>;
  /** Android 14+ lets the user switch off full-screen alarms for an app. */
  canUseFullScreenIntent: () => Promise<boolean>;
  openFullScreenIntentSettings: () => Promise<void>;
  areNotificationsEnabled: () => Promise<boolean>;
  openNotificationSettings: () => Promise<void>;
  /** Schedules the next ring (replacing any earlier one). Without `repeat`, it rings once. */
  schedule: (ringAt: Date, notice: AuroraNotice, repeat?: AuroraRepeat) => Promise<void>;
  cancel: () => Promise<void>;
  /** The ring the phone has set, or null. */
  getNextRing: () => Promise<Date | null>;
  isRinging: () => Promise<boolean>;
  /** Stops the sound and clears the notification. Only the ring screen calls this. */
  stopRinging: () => Promise<void>;
  /** Called when Aurora starts ringing while the app is running. Returns the unsubscribe. */
  onRing: (listener: () => void) => () => void;
};

export const unsupportedAuroraBridge: AuroraBridge = {
  isSupported: false,
  canScheduleExact: async () => false,
  openExactAlarmSettings: async () => undefined,
  canUseFullScreenIntent: async () => false,
  openFullScreenIntentSettings: async () => undefined,
  areNotificationsEnabled: async () => false,
  openNotificationSettings: async () => undefined,
  schedule: async () => undefined,
  cancel: async () => undefined,
  getNextRing: async () => null,
  isRinging: async () => false,
  stopRinging: async () => undefined,
  onRing: () => () => undefined,
};

/** Wraps the Kotlin module in the bridge's shape. */
export function createNativeAuroraBridge(native: AuroraNativeModule): AuroraBridge {
  return {
    isSupported: true,
    canScheduleExact: () => native.canScheduleExact(),
    openExactAlarmSettings: () => native.openExactAlarmSettings(),
    canUseFullScreenIntent: () => native.canUseFullScreenIntent(),
    openFullScreenIntentSettings: () => native.openFullScreenIntentSettings(),
    areNotificationsEnabled: () => native.areNotificationsEnabled(),
    openNotificationSettings: () => native.openNotificationSettings(),
    schedule: (ringAt, notice, repeat) =>
      native.schedule(ringAt.getTime(), {
        ...notice,
        minutes: repeat?.minutes ?? -1,
        daysMask: repeat?.daysMask ?? 0,
      }),
    cancel: () => native.cancel(),
    getNextRing: async () => {
      const at = await native.getNextRing();
      return at == null ? null : new Date(at);
    },
    isRinging: () => native.isRinging(),
    stopRinging: () => native.stopRinging(),
    onRing: (listener) => {
      const subscription = native.addListener('onRing', () => listener());
      return () => subscription.remove();
    },
  };
}

/** The bridge the app uses: the native module when it is built in, the stub otherwise. */
export const auroraBridge: AuroraBridge = auroraNativeModule
  ? createNativeAuroraBridge(auroraNativeModule)
  : unsupportedAuroraBridge;
