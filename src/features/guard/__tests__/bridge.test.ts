import type { VigilNativeModule } from '../../../../modules/vigil';
import {
  guardBridge,
  selectGuardBridge,
  toFocusEvent,
  toNativeFocusConfig,
  unsupportedGuardBridge,
} from '../bridge';

const START = new Date(2026, 9, 31, 9, 0);
const END = new Date(2026, 9, 31, 9, 25);

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
    });

    const heard = jest.fn();
    const unsubscribe = bridge.onFocusEvent(heard);
    emit({ type: 'appClosed', packageName: 'org.example.feed' });
    emit({ type: 'reel', packageName: 'org.example.feed' });
    expect(heard).toHaveBeenCalledTimes(1);
    expect(heard).toHaveBeenCalledWith({ type: 'appClosed', packageName: 'org.example.feed' });
    unsubscribe();
    expect(remove).toHaveBeenCalled();
    // Reel counting isn't native yet: the stub's answer.
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
