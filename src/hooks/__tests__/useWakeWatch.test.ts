import { act, renderHook, waitFor } from '@testing-library/react-native';

import { notificationsCopy } from '@/copy';
import { usePreferencesStore, useRemindersStore } from '@/stores';

import { useWakeWatch, wakeWatchCopy } from '../useWakeWatch';

const mockSetWakeWatch = jest.fn(async () => undefined);
jest.mock('@/features/guard', () => ({
  ...jest.requireActual('@/features/guard'),
  guardBridge: {
    ...jest.requireActual('@/features/guard').unsupportedGuardBridge,
    isSupported: true,
    setWakeWatch: (...args: unknown[]) => mockSetWakeWatch(...(args as [])),
  },
}));
jest.mock('../useToday', () => ({ useToday: () => '2026-11-01' }));

beforeEach(() => {
  mockSetWakeWatch.mockClear();
  useRemindersStore.setState({ isOn: true });
  usePreferencesStore.setState({ tone: 'centurion' });
});

describe('wakeWatchCopy', () => {
  it('picks the title and body in the user tone', () => {
    const copy = wakeWatchCopy('roast');
    expect(copy.title).toBe(notificationsCopy.wakePrompt.title.roast);
    expect(copy.body).toBe(notificationsCopy.wakePrompt.body.roast);
    expect(copy.channelName).toBe(notificationsCopy.wakePrompt.channelName);
  });
});

describe('useWakeWatch', () => {
  it('sends the watch once (off with no arc) and not again on a re-render', async () => {
    const { rerender } = renderHook(() => useWakeWatch());
    await waitFor(() => expect(mockSetWakeWatch).toHaveBeenCalledTimes(1));
    expect(mockSetWakeWatch).toHaveBeenCalledWith({
      enabled: false,
      awakeDay: null,
      copy: wakeWatchCopy('centurion'),
    });
    rerender({});
    expect(mockSetWakeWatch).toHaveBeenCalledTimes(1);
  });

  it('sends again when the tone changes', async () => {
    renderHook(() => useWakeWatch());
    await waitFor(() => expect(mockSetWakeWatch).toHaveBeenCalledTimes(1));
    act(() => usePreferencesStore.setState({ tone: 'philosopher' }));
    await waitFor(() => expect(mockSetWakeWatch).toHaveBeenCalledTimes(2));
    expect(mockSetWakeWatch).toHaveBeenLastCalledWith(
      expect.objectContaining({ copy: wakeWatchCopy('philosopher') }),
    );
  });
});
