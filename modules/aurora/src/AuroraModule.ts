import { requireOptionalNativeModule } from 'expo';

/** What addListener returns. */
type Subscription = { remove(): void };

/** The repeat rule and the notification text the native side keeps for later rings. */
export type AuroraNativePlan = {
  /** Minutes after midnight, or -1 for a one-off ring. */
  minutes: number;
  /** Bit 0 = Monday ... bit 6 = Sunday. */
  daysMask: number;
  channelName: string;
  title: string;
  body: string;
  action: string;
  timedOutTitle: string;
  timedOutBody: string;
};

export type AuroraNativeModule = {
  canScheduleExact(): Promise<boolean>;
  openExactAlarmSettings(): Promise<void>;
  canUseFullScreenIntent(): Promise<boolean>;
  openFullScreenIntentSettings(): Promise<void>;
  areNotificationsEnabled(): Promise<boolean>;
  openNotificationSettings(): Promise<void>;
  schedule(epochMillis: number, plan: AuroraNativePlan): Promise<void>;
  cancel(): Promise<void>;
  getNextRing(): Promise<number | null>;
  isRinging(): Promise<boolean>;
  stopRinging(): Promise<void>;
  /** Stops the buzz but keeps the sound (the mission is under way). Missing in builds before 2 Nov. */
  stopVibrating?(): Promise<void>;
  addListener(eventName: 'onRing', listener: (event: { at: number }) => void): Subscription;
};

/**
 * The Kotlin module (android/), or null where it isn't built in: Expo Go, iOS, web and Jest.
 * The app reaches it only through src/features/aurora/bridge.ts.
 */
export const auroraNativeModule = requireOptionalNativeModule<AuroraNativeModule>('VincoAurora');
