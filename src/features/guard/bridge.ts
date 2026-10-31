import type { FocusGuard } from '@/features/focus';

import {
  type VigilNativeFocusConfig,
  type VigilNativeModule,
  type VigilNativeWakeWatch,
  vigilNativeModule,
} from '../../../modules/vigil';

import type { GuardLevel } from './guard';
import { WAKE_PROMPT, type WakeWatchConfig } from './wakeWatch';

export type GuardPermission = 'accessibility' | 'overlay';

/** An app the user can allow during a focus ("Comites"). `icon` is a small PNG data URI (about 96 px). */
export type FocusApp = { packageName: string; label: string; icon: string | null };

/** What the native guard reports while a focus runs. */
export type FocusEventType = 'nudge' | 'appBlocked' | 'appClosed';
export type FocusEvent = { type: FocusEventType; packageName: string | null };

/**
 * The words on the native overlays (src/copy/focus.ts `overlay`). `closingIn` and `cooldown` are
 * followed by a time ("Closes in 2:41"). Missing ones keep the native defaults.
 */
export type FocusOverlayCopy = {
  alertTitle: string;
  alertBody: string;
  nudgeTitle: string;
  nudgeBody: string;
  openVinco: string;
  closingIn: string;
  cooldown: string;
};

export type FocusGuardConfig = {
  guard: FocusGuard;
  startedAt: Date;
  endsAt: Date;
  /** The Comites. The native side always adds Vinco, the dialer, calls and emergency. */
  allowedPackages: readonly string[];
  copy?: Partial<FocusOverlayCopy>;
};

/**
 * The contract the native Vigil module (modules/vigil, Kotlin) implements. Screens talk to this,
 * never to native code directly: Expo Go, iOS and tests get the unsupported stub, the development
 * build gets the module. See docs/GUARDIANS.md "Focus guards (built)".
 */
export type GuardBridge = {
  /** False in Expo Go and older builds (no native module). */
  isSupported: boolean;
  /** Which permissions are granted now: the guard service (accessibility) and draw over other apps. */
  getPermissions: () => Promise<Record<GuardPermission, boolean>>;
  /** Opens the phone's settings page for a permission. */
  openPermissionSettings: (permission: GuardPermission) => Promise<void>;
  /** Starts or changes the reel watch. Pax counts only; higher levels add the badge and checks. */
  configure: (config: {
    level: GuardLevel;
    reelBudget: number;
    markedPackages: readonly string[];
  }) => Promise<void>;
  /** Reels counted today (local day). */
  getTodayCount: () => Promise<number>;
  /** Live count updates. Returns the unsubscribe. */
  onReel: (listener: (count: number) => void) => () => void;
  /** The phone's launchable apps, sorted by label, without Vinco. Empty where unsupported. */
  listLaunchableApps: () => Promise<FocusApp[]>;
  /** The phone's default Phone app, or null. */
  getDialerPackage: () => Promise<string | null>;
  /** Opens an installed app (the focus dock). False when it can't be opened or isn't supported. */
  launchApp: (packageName: string) => Promise<boolean>;
  /**
   * Guards the phone for a focus until `endsAt`. The native side stops on its own at `endsAt`
   * (never later), even if Vinco is closed or the phone restarts.
   */
  startFocus: (config: FocusGuardConfig) => Promise<void>;
  /** Lifts the focus guard (completed or given up). Safe to call when none is on. */
  endFocus: () => Promise<void>;
  /** Events from the native guard while a focus runs. Returns the unsubscribe. */
  onFocusEvent: (listener: (event: FocusEvent) => void) => () => void;
  /**
   * "Are you up?": keeps the native unlock watch in step (src/hooks/useWakeWatch.ts). Fires only
   * while the guard service runs. Logging wake-up today also clears a prompt still on screen.
   */
  setWakeWatch: (config: WakeWatchConfig) => Promise<void>;
};

/** Expo Go, iOS and tests: everything reports "not available", nothing throws. */
export const unsupportedGuardBridge: GuardBridge = {
  isSupported: false,
  getPermissions: async () => ({ accessibility: false, overlay: false }),
  openPermissionSettings: async () => undefined,
  configure: async () => undefined,
  getTodayCount: async () => 0,
  onReel: () => () => undefined,
  listLaunchableApps: async () => [],
  getDialerPackage: async () => null,
  launchApp: async () => false,
  startFocus: async () => undefined,
  endFocus: async () => undefined,
  onFocusEvent: () => () => undefined,
  setWakeWatch: async () => undefined,
};

const FOCUS_EVENT_TYPES: readonly FocusEventType[] = ['nudge', 'appBlocked', 'appClosed'];

/** The config as the Kotlin side takes it: epoch milliseconds, the list without blanks or repeats. */
export function toNativeFocusConfig(config: FocusGuardConfig): VigilNativeFocusConfig {
  const packages = config.allowedPackages.map((name) => name.trim()).filter((name) => name.length > 0);
  const copy: Record<string, string> = {};
  for (const [key, value] of Object.entries(config.copy ?? {})) {
    if (typeof value === 'string' && value.trim().length > 0) copy[key] = value;
  }
  return {
    guard: config.guard,
    startedAt: config.startedAt.getTime(),
    endsAt: config.endsAt.getTime(),
    allowedPackages: [...new Set(packages)],
    copy,
  };
}

/** The wake watch as the Kotlin side takes it: the window from WAKE_PROMPT, the copy flattened. */
export function toNativeWakeWatch(config: WakeWatchConfig): VigilNativeWakeWatch {
  return {
    enabled: config.enabled,
    fromMinutes: WAKE_PROMPT.fromMinutes,
    untilMinutes: WAKE_PROMPT.untilMinutes,
    awakeDay: config.awakeDay,
    title: config.copy.title,
    body: config.copy.body,
    channelName: config.copy.channelName,
  };
}

/** A native event in the bridge's shape, or null for anything unknown. */
export function toFocusEvent(raw: unknown): FocusEvent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { type, packageName } = raw as { type?: unknown; packageName?: unknown };
  if (!FOCUS_EVENT_TYPES.includes(type as FocusEventType)) return null;
  return {
    type: type as FocusEventType,
    packageName: typeof packageName === 'string' && packageName.length > 0 ? packageName : null,
  };
}

/**
 * Wraps the Kotlin module in the bridge's shape. Reel counting is not native yet, so those
 * members keep the stub's behaviour.
 */
export function createNativeGuardBridge(native: VigilNativeModule): GuardBridge {
  return {
    ...unsupportedGuardBridge,
    isSupported: true,
    getPermissions: () => native.getPermissions(),
    openPermissionSettings: (permission) => native.openPermissionSettings(permission),
    listLaunchableApps: () => native.listLaunchableApps(),
    getDialerPackage: () => native.getDialerPackage(),
    launchApp: (packageName) => native.launchApp(packageName),
    startFocus: (config) => native.startFocus(toNativeFocusConfig(config)),
    endFocus: () => native.endFocus(),
    onFocusEvent: (listener) => {
      const subscription = native.addListener('onFocusEvent', (raw) => {
        const event = toFocusEvent(raw);
        if (event) listener(event);
      });
      return () => subscription.remove();
    },
    setWakeWatch: (config) => native.setWakeWatch(toNativeWakeWatch(config)),
  };
}

/** Picks the native module when it is built in, the stub otherwise. */
export function selectGuardBridge(native: VigilNativeModule | null | undefined): GuardBridge {
  return native ? createNativeGuardBridge(native) : unsupportedGuardBridge;
}

/** The bridge the app uses. */
export const guardBridge: GuardBridge = selectGuardBridge(vigilNativeModule);
