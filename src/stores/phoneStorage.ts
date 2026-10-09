import { Storage } from 'expo-sqlite/kv-store';
import { createJSONStorage, type PersistStorage, type StateStorage } from 'zustand/middleware';

/**
 * Key-value storage on the phone (expo-sqlite's kv-store), adapted for Zustand's persist.
 * Uses the synchronous API, so stores are restored before the first render: no flash
 * of default values, no loading state. A storage failure is logged in development
 * and treated as "nothing saved"; it never crashes the app.
 */
const syncPhoneStorage: StateStorage = {
  getItem(name) {
    try {
      return Storage.getItemSync(name);
    } catch (error) {
      if (__DEV__) console.warn(`[storage] Could not read "${name}".`, error);
      return null;
    }
  },
  setItem(name, value) {
    try {
      Storage.setItemSync(name, value);
    } catch (error) {
      if (__DEV__) console.warn(`[storage] Could not save "${name}".`, error);
    }
  },
  removeItem(name) {
    try {
      Storage.removeItemSync(name);
    } catch (error) {
      if (__DEV__) console.warn(`[storage] Could not remove "${name}".`, error);
    }
  },
};

/** JSON storage for a persisted Zustand store. */
export function createPhoneStorage<S>(): PersistStorage<S> | undefined {
  return createJSONStorage<S>(() => syncPhoneStorage);
}
