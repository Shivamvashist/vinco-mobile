import { requireOptionalNativeModule } from 'expo';

/** What addListener returns. */
type Subscription = { remove(): void };

/** One launchable app, as the Kotlin side reports it. */
export type VigilNativeApp = { packageName: string; label: string; icon: string | null };

/** What startFocus sends. Times are epoch milliseconds; `copy` holds the overlay words. */
export type VigilNativeFocusConfig = {
  guard: string;
  startedAt: number;
  endsAt: number;
  allowedPackages: string[];
  copy: Record<string, string>;
};

export type VigilNativeFocusEvent = { type: string; packageName: string | null };

export type VigilNativeModule = {
  getPermissions(): Promise<{ accessibility: boolean; overlay: boolean }>;
  openPermissionSettings(permission: string): Promise<void>;
  listLaunchableApps(): Promise<VigilNativeApp[]>;
  getDialerPackage(): Promise<string | null>;
  launchApp(packageName: string): Promise<boolean>;
  startFocus(config: VigilNativeFocusConfig): Promise<void>;
  endFocus(): Promise<void>;
  addListener(eventName: 'onFocusEvent', listener: (event: VigilNativeFocusEvent) => void): Subscription;
};

/**
 * The Kotlin module (android/), or null where it isn't built in: Expo Go, iOS, web and Jest.
 * The app reaches it only through src/features/guard/bridge.ts.
 */
export const vigilNativeModule = requireOptionalNativeModule<VigilNativeModule>('VincoVigil');
