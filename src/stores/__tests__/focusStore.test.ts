import { act } from '@testing-library/react-native';

import { sanitizeFocusUi, useFocusUiStore } from '../focusStore';

describe('focus store', () => {
  beforeEach(() => useFocusUiStore.getState().reset());

  it('keeps the rain sound off unless it was saved on', () => {
    expect(useFocusUiStore.getState().isRainSoundOn).toBe(false);
    expect(sanitizeFocusUi({ isRainSoundOn: true })).toEqual({ isRainSoundOn: true });
    expect(sanitizeFocusUi({ isRainSoundOn: 'yes' })).toEqual({ isRainSoundOn: false });
    expect(sanitizeFocusUi('broken')).toEqual({ isRainSoundOn: false });
    expect(sanitizeFocusUi(null)).toEqual({ isRainSoundOn: false });
  });

  it('remembers the rain toggle, and saves only that', () => {
    act(() => {
      useFocusUiStore.getState().setRainSound(true);
      useFocusUiStore.getState().markSeen(4);
    });
    expect(useFocusUiStore.getState()).toMatchObject({ isRainSoundOn: true, seenSessionId: 4 });
    const options = useFocusUiStore.persist.getOptions();
    expect(options.partialize?.(useFocusUiStore.getState())).toEqual({ isRainSoundOn: true });
    act(() => useFocusUiStore.getState().setRainSound(false));
    expect(useFocusUiStore.getState().isRainSoundOn).toBe(false);
  });
});
