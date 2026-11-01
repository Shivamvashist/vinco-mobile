import type { VigilNativeModule } from '../../../../modules/vigil';
import { PALETTES } from '@/theme';
import {
  guardBridge,
  selectGuardBridge,
  toFocusEvent,
  toNativeFocusConfig,
  toNativeWakeWatch,
  unsupportedGuardBridge,
} from '../bridge';
import { FOCUS_OVERLAY_ROLES, focusOverlayTheme } from '../overlayTheme';

const marble = PALETTES.find((palette) => palette.id === 'marble') ?? PALETTES[0]!;
const START = new Date(2026, 9, 31, 9, 0);
const END = new Date(2026, 9, 31, 9, 25);
const WAKE_COPY = { title: 'Are you up?', body: 'Log your wake-up.', channelName: 'Wake-up check' };

function fakeNative() {
  let listener: ((event: unknown) => void) | null = null;
  const remove = jest.fn(() => {
    listener = null;
  });
  const native = {
    getPermissions: jest.fn(async () => ({ accessibility: true, overlay: false })),
    openPermissionSettings: jest.fn(async () => undefined),
    listLaunchableApps: jest.fn(async () => [
      { packageName: 'org.example.notes', label: 'Notes', icon: null },
    ]),
    getDialerPackage: jest.fn(async () => 'com.google.android.dialer'),
    launchApp: jest.fn(async (packageName: string) => packageName === 'org.example.notes'),
    startFocus: jest.fn(async () => undefined),
    endFocus: jest.fn(async () => undefined),
    setWakeWatch: jest.fn(async () => undefined),
    addListener: jest.fn((_name: string, next: (event: unknown) => void) => {
      listener = next;
      return { remove };
    }),
  };
  return { native, emit: (event: unknown) => listener?.(event), remove };
}

describe('guard bridge selection', () => {
  it('uses the stub when the native module is missing (Expo Go, Jest)', () => {
    expect(guardBridge).toBe(unsupportedGuardBridge);
    expect(selectGuardBridge(null)).toBe(unsupportedGuardBridge);
    expect(selectGuardBridge(undefined).isSupported).toBe(false);
  });

  it('keeps the stub safe: nothing throws, nothing is granted', async () => {
    const bridge = unsupportedGuardBridge;
    await expect(bridge.getPermissions()).resolves.toEqual({ accessibility: false, overlay: false });
    await expect(bridge.listLaunchableApps()).resolves.toEqual([]);
    await expect(bridge.getDialerPackage()).resolves.toBeNull();
    await expect(bridge.launchApp('org.example.notes')).resolves.toBe(false);
    await expect(
      bridge.startFocus({ guard: 'silentium', startedAt: START, endsAt: END, allowedPackages: [] }),
    ).resolves.toBeUndefined();
    await expect(bridge.endFocus()).resolves.toBeUndefined();
    expect(() => bridge.onFocusEvent(() => undefined)()).not.toThrow();
    await expect(
      bridge.setWakeWatch({ enabled: true, awakeDay: null, copy: WAKE_COPY }),
    ).resolves.toBeUndefined();
  });

  it('wraps the native module when it is built in', async () => {
    const { native, emit, remove } = fakeNative();
    const bridge = selectGuardBridge(native as unknown as VigilNativeModule);
    expect(bridge.isSupported).toBe(true);
    await expect(bridge.getPermissions()).resolves.toEqual({ accessibility: true, overlay: false });
    await expect(bridge.getDialerPackage()).resolves.toBe('com.google.android.dialer');
    await expect(bridge.launchApp('org.example.notes')).resolves.toBe(true);
    await expect(bridge.launchApp('org.example.gone')).resolves.toBe(false);

    await bridge.startFocus({
      guard: 'imperium',
      startedAt: START,
      endsAt: END,
      allowedPackages: ['org.example.notes'],
    });
    expect(native.startFocus).toHaveBeenCalledWith({
      guard: 'imperium',
      startedAt: START.getTime(),
      endsAt: END.getTime(),
      allowedPackages: ['org.example.notes'],
      copy: {},
      colors: {},
      scheme: 'dark',
    });

    const heard = jest.fn();
    const unsubscribe = bridge.onFocusEvent(heard);
    emit({ type: 'appClosed', packageName: 'org.example.feed' });
    emit({ type: 'reel', packageName: 'org.example.feed' });
    expect(heard).toHaveBeenCalledTimes(1);
    expect(heard).toHaveBeenCalledWith({ type: 'appClosed', packageName: 'org.example.feed' });
    unsubscribe();
    expect(remove).toHaveBeenCalled();
    await bridge.setWakeWatch({ enabled: true, awakeDay: '2026-11-01', copy: WAKE_COPY });
    expect(native.setWakeWatch).toHaveBeenCalledWith(
      toNativeWakeWatch({ enabled: true, awakeDay: '2026-11-01', copy: WAKE_COPY }),
    );
    // A build from before the reel counter (no configure): the stub's answer.
    expect(bridge.canCountReels).toBe(false);
    await expect(bridge.getTodayCount()).resolves.toBe(0);
  });
});

describe('toNativeFocusConfig', () => {
  it('sends epoch milliseconds and a clean list of packages and words', () => {
    expect(
      toNativeFocusConfig({
        guard: 'custos',
        startedAt: START,
        endsAt: END,
        allowedPackages: [' org.example.notes ', '', 'org.example.notes', 'org.example.maps'],
        copy: { alertTitle: 'Focus is on', alertBody: '  ' },
      }),
    ).toEqual({
      guard: 'custos',
      startedAt: START.getTime(),
      endsAt: END.getTime(),
      allowedPackages: ['org.example.notes', 'org.example.maps'],
      copy: { alertTitle: 'Focus is on' },
      colors: {},
      scheme: 'dark',
    });
  });

  it("sends the active palette's overlay roles and its scheme", () => {
    const theme = focusOverlayTheme({ scheme: 'light', colors: marble.colors });
    const native = toNativeFocusConfig({
      guard: 'imperium',
      startedAt: START,
      endsAt: END,
      allowedPackages: [],
      theme,
    });
    expect(native.scheme).toBe('light');
    expect(Object.keys(native.colors).sort()).toEqual([...FOCUS_OVERLAY_ROLES].sort());
    expect(native.colors.accent).toBe(marble.colors.accent);
    expect(native.colors.scrim).toBe(marble.colors.scrim);
  });

  it('drops blank colours, so the native side keeps its own', () => {
    const theme = focusOverlayTheme({ scheme: 'dark', colors: { ...marble.colors, accent: '  ' } });
    expect(
      toNativeFocusConfig({ guard: 'custos', startedAt: START, endsAt: END, allowedPackages: [], theme })
        .colors,
    ).not.toHaveProperty('accent');
  });
});

describe('toNativeWakeWatch', () => {
  it('adds the 03:00 to 12:00 window and flattens the copy', () => {
    expect(toNativeWakeWatch({ enabled: false, awakeDay: null, copy: WAKE_COPY })).toEqual({
      enabled: false,
      fromMinutes: 180,
      untilMinutes: 720,
      awakeDay: null,
      title: 'Are you up?',
      body: 'Log your wake-up.',
      channelName: 'Wake-up check',
    });
  });
});

describe('toFocusEvent', () => {
  it('keeps known events and drops anything else', () => {
    expect(toFocusEvent({ type: 'nudge', packageName: 'org.example.feed' })).toEqual({
      type: 'nudge',
      packageName: 'org.example.feed',
    });
    expect(toFocusEvent({ type: 'appBlocked', packageName: '' })).toEqual({
      type: 'appBlocked',
      packageName: null,
    });
    expect(toFocusEvent({ type: 'other' })).toBeNull();
    expect(toFocusEvent(null)).toBeNull();
    expect(toFocusEvent('nudge')).toBeNull();
  });
});
