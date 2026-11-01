import type { VigilNativeModule } from '../../../../modules/vigil';
import { selectGuardBridge, unsupportedGuardBridge } from '../bridge';

function fakeReelNative() {
  const listeners = new Map<string, (event: unknown) => void>();
  const remove = jest.fn();
  const native = {
    getPermissions: jest.fn(async () => ({ accessibility: true, overlay: true })),
    configure: jest.fn(async () => undefined),
    getTodayCount: jest.fn(async () => 12),
    getReelDays: jest.fn(async () => [
      { day: '2026-11-01', count: 12 },
      { day: 'bad', count: 1 },
      { day: '2026-10-31', count: 41 },
    ]),
    addListener: jest.fn((name: string, next: (event: unknown) => void) => {
      listeners.set(name, next);
      return { remove };
    }),
  };
  return { native, emit: (name: string, event: unknown) => listeners.get(name)?.(event), remove };
}

describe('reel counter through the guard bridge', () => {
  it('keeps the stub harmless', async () => {
    expect(unsupportedGuardBridge.canCountReels).toBe(false);
    await expect(
      unsupportedGuardBridge.configure({ level: 'vigil', reelBudget: 30, markedPackages: [] }),
    ).resolves.toBeUndefined();
    await expect(unsupportedGuardBridge.getTodayCount()).resolves.toBe(0);
    await expect(unsupportedGuardBridge.getReelDays()).resolves.toEqual([]);
    expect(() => unsupportedGuardBridge.onReel(() => undefined)()).not.toThrow();
  });

  it('calls the module and cleans what comes back', async () => {
    const { native, emit, remove } = fakeReelNative();
    const bridge = selectGuardBridge(native as unknown as VigilNativeModule);
    expect(bridge.canCountReels).toBe(true);

    await bridge.configure({
      level: 'imperium',
      reelBudget: 42,
      markedPackages: ['com.instagram.android', ' '],
      copy: { badge: '{count} reels' },
      colors: { over: '#D0697D' },
    });
    expect(native.configure).toHaveBeenCalledWith({
      level: 'imperium',
      reelBudget: 40,
      markedPackages: ['com.instagram.android'],
      passDay: '',
      passes: 0,
      denarii: 0,
      passPrice: 20,
      passReels: 12,
      passMax: 3,
      copy: { badge: '{count} reels' },
      colors: { over: '#D0697D' },
    });

    await expect(bridge.getTodayCount()).resolves.toBe(12);
    await expect(bridge.getReelDays()).resolves.toEqual([
      { day: '2026-10-31', count: 41 },
      { day: '2026-11-01', count: 12 },
    ]);

    const heard = jest.fn();
    const unsubscribe = bridge.onReel(heard);
    emit('onReel', { count: 13, day: '2026-11-01' });
    emit('onReel', { count: 'many' });
    expect(heard).toHaveBeenCalledTimes(1);
    expect(heard).toHaveBeenCalledWith(13);
    unsubscribe();
    expect(remove).toHaveBeenCalled();
  });

  it('answers 0 when the module reports a malformed count', async () => {
    const { native } = fakeReelNative();
    native.getTodayCount.mockResolvedValueOnce(Number.NaN);
    const bridge = selectGuardBridge(native as unknown as VigilNativeModule);
    await expect(bridge.getTodayCount()).resolves.toBe(0);
  });
});
