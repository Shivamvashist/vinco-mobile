import { requireOptionalNativeModule } from 'expo';

/** What addListener returns. */
type Subscription = { remove(): void };

/** One launchable app, as the Kotlin side reports it. */
export type VigilNativeApp = { packageName: string; label: string; icon: string | null };

/**
 * What startFocus sends. Times are epoch milliseconds; `copy` holds the overlay words, `colors`
 * the active palette's roles for the overlays (CSS colours) and `scheme` whether it is dark or light.
 */
export type VigilNativeFocusConfig = {
  guard: string;
  startedAt: number;
  endsAt: number;
  allowedPackages: string[];
  copy: Record<string, string>;
  colors: Record<string, string>;
  scheme: 'dark' | 'light';
};

/** What setWakeWatch sends: the "Are you up?" prompt. Minutes from local midnight, `awakeDay` yyyy-MM-dd. */
export type VigilNativeWakeWatch = {
  enabled: boolean;
  fromMinutes: number;
  untilMinutes: number;
  awakeDay: string | null;
  title: string;
  body: string;
  channelName: string;
};

export type VigilNativeFocusEvent = { type: string; packageName: string | null };

/**
 * What configure sends: the reel watch. `copy` holds the overlay words with "{count}", "{budget}",
 * "{passes}", "{reels}" and "{price}" placeholders; `colors` the overlay colours as "#RRGGBB".
 */
export type VigilNativeReelConfig = {
  level: string;
  reelBudget: number;
  markedPackages: string[];
  /** The phone's day the passes belong to (yyyy-MM-dd), '' for none. */
  passDay: string;
  /** Reel passes used on passDay: each adds passReels to the budget. */
  passes: number;
  /** Denarii held, so the overlays offer a pass only when it is affordable. */
  denarii: number;
  passPrice: number;
  passReels: number;
  passMax: number;
  copy: Record<string, string>;
  colors: Record<string, string>;
};

/** One reel counted: the day's new count and its local day (yyyy-MM-dd). */
export type VigilNativeReelEvent = { count: number; day: string };

/** Last night's rest from screen on and off times: epoch milliseconds. */
export type VigilNativeNightRest = { sleptAt: number; wokeAt: number };

/** A kept day of reel counts. */
export type VigilNativeReelDay = { day: string; count: number };

export type VigilNativeModule = {
  getPermissions(): Promise<{ accessibility: boolean; overlay: boolean }>;
  openPermissionSettings(permission: string): Promise<void>;
  listLaunchableApps(): Promise<VigilNativeApp[]>;
  getDialerPackage(): Promise<string | null>;
  launchApp(packageName: string): Promise<boolean>;
  startFocus(config: VigilNativeFocusConfig): Promise<void>;
  endFocus(): Promise<void>;
  setWakeWatch(config: VigilNativeWakeWatch): Promise<void>;
  addListener(eventName: 'onFocusEvent', listener: (event: VigilNativeFocusEvent) => void): Subscription;
  addListener(eventName: 'onReel', listener: (event: VigilNativeReelEvent) => void): Subscription;
  /** The reel counter. Optional: a development build from before it (1 Nov) lacks these. */
  configure?(config: VigilNativeReelConfig): Promise<void>;
  getTodayCount?(): Promise<number>;
  getReelDays?(): Promise<VigilNativeReelDay[]>;
  /** Last night's rest, or null. Optional: development builds from before 2 Nov lack it. */
  getNightRest?(): Promise<VigilNativeNightRest | null>;
};

/**
 * The Kotlin module (android/), or null where it isn't built in: Expo Go, iOS, web and Jest.
 * The app reaches it only through src/features/guard/bridge.ts.
 */
export const vigilNativeModule = requireOptionalNativeModule<VigilNativeModule>('VincoVigil');
