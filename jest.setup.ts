/**
 * Runs before every test file. Replaces native modules (which don't exist in Node)
 * with small fakes, so any module, including '@/theme' and '@/stores', can be imported in tests.
 */

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    volume: 1,
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    release: jest.fn(),
  })),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-sqlite/kv-store', () => {
  const memory = new Map<string, string>();
  const Storage = {
    getItemSync: (key: string) => memory.get(key) ?? null,
    setItemSync: (key: string, value: string) => void memory.set(key, value),
    removeItemSync: (key: string) => memory.delete(key),
    clearSync: () => memory.clear(),
  };
  return { __esModule: true, Storage, default: Storage };
});
