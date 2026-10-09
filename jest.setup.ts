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
  RecordingPresets: { HIGH_QUALITY: {} },
  useAudioRecorder: () => ({
    uri: 'file:///cache/recording.m4a',
    prepareToRecordAsync: jest.fn(() => Promise.resolve()),
    record: jest.fn(),
    stop: jest.fn(() => Promise.resolve()),
  }),
  useAudioRecorderState: () => ({ isRecording: false, durationMillis: 0, canRecord: true }),
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(() => Promise.resolve()) }),
  useAudioPlayerStatus: () => ({ playing: false, didJustFinish: false }),
  getRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true })),
  requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true })),
}));

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    // Takes a "photo" when asked, like the real camera's ref.
    CameraView: React.forwardRef((props: object, ref: unknown) => {
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: async () => ({ uri: 'file:///cache/photo.jpg', width: 1080, height: 1440 }),
      }));
      return React.createElement(View, props);
    }),
    useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
  };
});

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('file:///cache/day-card.png')),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-file-system', () => {
  class FakeEntry {
    uri: string;
    exists = false;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
    }
    create() {
      this.exists = true;
    }
    delete() {
      this.exists = false;
    }
    async move(destination: { uri: string }) {
      this.uri = destination.uri;
    }
  }
  return { File: FakeEntry, Directory: FakeEntry, Paths: { document: { uri: 'file:///documents' } } };
});

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

// Animations: the libraries' own mocks. Animations finish instantly in tests.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  // Missing from the official mock. false = motion allowed, so tests take the animated path.
  useReducedMotion: () => false,
}));

// Database: a real in-memory SQLite with the app's migrations (see src/db/testing/testDatabase.ts).
jest.mock('@/db/client', () => ({ db: require('@/db/testing/testDatabase').createTestDatabase() }));
jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({
  useMigrations: () => ({ success: true, error: undefined }),
}));
// Test version of Drizzle's live query: reads synchronously and re-renders after every write.
jest.mock('drizzle-orm/expo-sqlite', () => {
  const React = require('react');
  const { subscribeToTestWrites } = require('@/db/testing/testDatabase');
  return {
    useLiveQuery: (query: { all: () => unknown[] }) => {
      const [, rerender] = React.useReducer((count: number) => count + 1, 0);
      // Like the real hook, read again after mount: earlier effects (such as sealing) may have written.
      React.useEffect(() => {
        rerender();
        return subscribeToTestWrites(rerender);
      }, []);
      return { data: query.all(), error: undefined, updatedAt: new Date(0) };
    },
  };
});
