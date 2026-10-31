import type { FocusGuard } from '@/features/focus';

import type { GuardLevel } from './guard';

/**
 * The contract the native Vigil module (modules/vigil, Kotlin) will implement. Screens talk to
 * this, never to native code directly, so the app runs in Expo Go with the stub below and the
 * real module drops in later in one place. See docs/GUARDIANS.md.
 */
export type GuardPermission = 'accessibility' | 'overlay';

export type GuardBridge = {
  /** False until the native module ships (Expo Go, or an older build). */
  isSupported: boolean;
  /** Which permissions are granted now. */
  getPermissions: () => Promise<Record<GuardPermission, boolean>>;
  /** Opens the phone's settings page for a permission. */
  openPermissionSettings: (permission: GuardPermission) => Promise<void>;
  /** Starts or changes the watch. Pax counts only; higher levels add the badge and checks. */
  configure: (config: {
    level: GuardLevel;
    reelBudget: number;
    markedPackages: readonly string[];
  }) => Promise<void>;
  /** Reels counted today (local day). */
  getTodayCount: () => Promise<number>;
  /** Live count updates. Returns the unsubscribe. */
  onReel: (listener: (count: number) => void) => () => void;
  /**
   * Guards the phone for a focus ("Acies") until `endsAt`: custos allows marked apps for
   * `allowanceMinutes` in all, imperium blocks them, silentium blocks all but calls, messages and Vinco.
   */
  startFocus: (config: { mode: FocusGuard; endsAt: Date; allowanceMinutes: number }) => Promise<void>;
  /** Lifts the focus guard (completed or given up). Safe to call when none is on. */
  endFocus: () => Promise<void>;
};

/** Used until the native module exists: everything reports "not available", nothing throws. */
export const unsupportedGuardBridge: GuardBridge = {
  isSupported: false,
  getPermissions: async () => ({ accessibility: false, overlay: false }),
  openPermissionSettings: async () => undefined,
  configure: async () => undefined,
  getTodayCount: async () => 0,
  onReel: () => () => undefined,
  startFocus: async () => undefined,
  endFocus: async () => undefined,
};

/** The bridge the app uses. Swap for the native module's implementation when it ships. */
export const guardBridge: GuardBridge = unsupportedGuardBridge;
