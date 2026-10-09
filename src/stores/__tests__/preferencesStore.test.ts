import { Storage } from 'expo-sqlite/kv-store';

import type * as PreferencesStoreModule from '../preferencesStore';

type PreferencesStore = PreferencesStoreModule.PreferencesStore;

const STORAGE_KEY = 'vinco.preferences';

/** Loads a fresh copy of the store, as if the app had just started. */
function loadStore(): { getState: () => PreferencesStore } {
  let store: { getState: () => PreferencesStore } | undefined;
  jest.isolateModules(() => {
    // A fresh require per call is the point: it re-runs the store's start-up restore.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    store = (require('../preferencesStore') as typeof PreferencesStoreModule).usePreferencesStore;
  });
  if (!store) throw new Error('Store failed to load');
  return store;
}

beforeEach(() => {
  Storage.removeItemSync(STORAGE_KEY);
});

describe('usePreferencesStore', () => {
  it('starts with the defaults when nothing is saved', () => {
    const state = loadStore().getState();
    expect(state.tone).toBe('centurion');
    expect(state.colorMode).toBe('dark');
    expect(state.soundEnabled).toBe(true);
  });

  it('saves changes and restores them on the next start', () => {
    const first = loadStore();
    first.getState().setTone('roast');
    first.getState().updateThemePreferences({ colorMode: 'light', hapticsEnabled: false });

    const restored = loadStore().getState();
    expect(restored.tone).toBe('roast');
    expect(restored.colorMode).toBe('light');
    expect(restored.hapticsEnabled).toBe(false);
  });

  it('falls back to defaults when the saved value is not valid JSON', () => {
    Storage.setItemSync(STORAGE_KEY, '{not json');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const state = loadStore().getState();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Could not restore'), expect.any(Error));
    warn.mockRestore();
    expect(state.tone).toBe('centurion');
    expect(state.colorMode).toBe('dark');
  });

  it('keeps valid saved fields and drops invalid ones', () => {
    Storage.setItemSync(
      STORAGE_KEY,
      JSON.stringify({ state: { tone: 'philosopher', colorMode: 'neon' }, version: 1 }),
    );
    const state = loadStore().getState();
    expect(state.tone).toBe('philosopher');
    expect(state.colorMode).toBe('dark');
  });

  it('ignores invalid values passed to updateThemePreferences', () => {
    const store = loadStore();
    store.getState().updateThemePreferences({ colorMode: 'neon' as never });
    expect(store.getState().colorMode).toBe('dark');
  });

  it('never saves the action functions', () => {
    loadStore().getState().setTone('roast');
    const saved = JSON.parse(Storage.getItemSync(STORAGE_KEY) ?? '{}') as { state: Record<string, unknown> };
    expect(Object.keys(saved.state).sort()).toEqual(
      ['colorMode', 'ghostOpacity', 'hapticsEnabled', 'soundEnabled', 'themeId', 'tone'].sort(),
    );
  });
});
