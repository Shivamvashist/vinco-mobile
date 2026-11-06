import type { FocusGuard } from '@/features/focus';
import { type NightRest, toNightRest } from '@/features/sleep';

import {
  type VigilNativeFocusConfig,
  type VigilNativeModule,
  type VigilNativeWakeWatch,
  vigilNativeModule,
} from '../../../modules/vigil';

import type { FocusOverlayTheme } from './overlayTheme';
import { type ReelWatchConfig, toNativeReelConfig, toReelEventCount } from './reelBridge';
import { type ReelDay, sanitizeReelDays, toReelCount } from './reels';
import { WAKE_PROMPT, type WakeWatchConfig } from './wakeWatch';

export type GuardPermission = 'accessibility' | 'overlay';

/** An app the user can allow during a focus ("Comites"). `icon` is a small PNG data URI (about 96 px). */
export type FocusApp = { packageName: string; label: string; icon: string | null };

/** What the native guard reports while a focus runs. */
export type FocusEventType = 'nudge' | 'appBlocked' | 'appClosed';
export type FocusEvent = { type: FocusEventType; packageName: string | null };

/**
 * The words on the native overlays and the bubble's focus panel (src/copy/focus.ts `overlay`).
 * `closingIn` and `cooldown` are followed by a time ("Closes in 2:41"), `endsAt` by the end time
 * ("Ends 7:40 pm"). Missing ones keep the native defaults (modules/vigil VigilCopy.kt).
 */
export type FocusOverlayCopy = {
  alertTitle: string;
  alertBody: string;
  nudgeTitle: string;
  nudgeBody: string;
  openVinco: string;
  backToFocus: string;
  dismiss: string;
  close: string;
  closingIn: string;
  restingTitle: string;
  cooldown: string;
  panelTitle: string;
  left: string;
  endsAt: string;
  companions: string;
  guardCustos: string;
  guardImperium: string;
  guardSilentium: string;
  bubbleHint: string;
};

export type FocusGuardConfig = {
  guard: FocusGuard;
  startedAt: Date;
  endsAt: Date;
  /** The Comites. The native side always adds Vinco, the dialer, calls and emergency. */
  allowedPackages: readonly string[];
  copy?: Partial<FocusOverlayCopy>;
  /** The active palette for the overlays (`focusOverlayTheme`). Without it the native side uses Basalt. */
  theme?: FocusOverlayTheme;
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
  /**
   * False where reels can't be counted: Expo Go, and development builds from before the reel
   * counter. The counting itself also needs the guard service (accessibility) turned on.
   */
  canCountReels: boolean;
  /**
   * Starts or changes the reel watch (src/hooks/useReelWatch.ts). Pax counts only; Vigil and up
   * add the badge and milestone cards. Kept on the phone, so counting goes on with Vinco closed.
   */
  configure: (config: ReelWatchConfig) => Promise<void>;
  /** Reels counted today (local day). */
  getTodayCount: () => Promise<number>;
  /** Every day the phone still keeps (about 60), today included, oldest first. */
  getReelDays: () => Promise<ReelDay[]>;
  /** Live count updates (today's new count). Returns the unsubscribe. */
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
  /**
   * Last night's rest from the screen's on and off times (modules/vigil VigilNight.kt), or null.
   * Learned only while the guard service runs. Check it with `getUsableBedtime` before use.
   */
  getNightRest: () => Promise<NightRest | null>;
};

/** Expo Go, iOS and tests: everything reports "not available", nothing throws. */
export const unsupportedGuardBridge: GuardBridge = {
  isSupported: false,
  getPermissions: async () => ({ accessibility: false, overlay: false }),
  openPermissionSettings: async () => undefined,
  canCountReels: false,
  configure: async () => undefined,
  getTodayCount: async () => 0,
  getReelDays: async () => [],
  onReel: () => () => undefined,
  listLaunchableApps: async () => [],
  getDialerPackage: async () => null,
  launchApp: async () => false,
  startFocus: async () => undefined,
  endFocus: async () => undefined,
  onFocusEvent: () => () => undefined,
  setWakeWatch: async () => undefined,
  getNightRest: async () => null,
};

const FOCUS_EVENT_TYPES: readonly FocusEventType[] = ['nudge', 'appBlocked', 'appClosed'];

/** The config as the Kotlin side takes it: epoch milliseconds, the list without blanks or repeats. */
export function toNativeFocusConfig(config: FocusGuardConfig): VigilNativeFocusConfig {
  const packages = config.allowedPackages.map((name) => name.trim()).filter((name) => name.length > 0);
  const copy: Record<string, string> = {};
  for (const [key, value] of Object.entries(config.copy ?? {})) {
    if (typeof value === 'string' && value.trim().length > 0) copy[key] = value;
  }
  const colors: Record<string, string> = {};
  for (const [role, value] of Object.entries(config.theme?.colors ?? {})) {
    if (typeof value === 'string' && value.trim().length > 0) colors[role] = value.trim();
  }
  return {
    guard: config.guard,
    startedAt: config.startedAt.getTime(),
    endsAt: config.endsAt.getTime(),
    allowedPackages: [...new Set(packages)],
    copy,
    colors,
    scheme: config.theme?.scheme ?? 'dark',
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
 * Wraps the Kotlin module in the bridge's shape. A build from before the reel counter keeps the
 * stub's reel members (see `createNativeReelMembers`).
 */
export function createNativeGuardBridge(native: VigilNativeModule): GuardBridge {
  return {
    ...unsupportedGuardBridge,
    ...createNativeReelMembers(native),
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
    getNightRest: async () => (native.getNightRest ? toNightRest(await native.getNightRest()) : null),
  };
}

type ReelMembers = Pick<
  GuardBridge,
  'canCountReels' | 'configure' | 'getTodayCount' | 'getReelDays' | 'onReel'
>;

/** The reel counter's members, when the module has them (development builds from 1 Nov on). */
function createNativeReelMembers(native: VigilNativeModule): Partial<ReelMembers> {
  const { configure, getTodayCount, getReelDays } = native;
  if (!configure || !getTodayCount || !getReelDays) return {};
  return {
    canCountReels: true,
    configure: (config) => configure.call(native, toNativeReelConfig(config)),
    getTodayCount: async () => toReelCount(await getTodayCount.call(native)) ?? 0,
    getReelDays: async () => sanitizeReelDays(await getReelDays.call(native)),
    onReel: (listener) => {
      const subscription = native.addListener('onReel', (raw) => {
        const count = toReelEventCount(raw);
        if (count != null) listener(count);
      });
      return () => subscription.remove();
    },
  };
}

/** Picks the native module when it is built in, the stub otherwise. */
export function selectGuardBridge(native: VigilNativeModule | null | undefined): GuardBridge {
  return native ? createNativeGuardBridge(native) : unsupportedGuardBridge;
}

/** The bridge the app uses. */
export const guardBridge: GuardBridge = selectGuardBridge(vigilNativeModule);
