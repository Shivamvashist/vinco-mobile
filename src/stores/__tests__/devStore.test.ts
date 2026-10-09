import { MAX_DAY_OFFSET, sanitizeDevState, useDevStore } from '..';

describe('sanitizeDevState', () => {
  it('keeps valid values and drops the rest', () => {
    expect(sanitizeDevState({ isDevModeOn: true, dayOffset: 3 })).toEqual({
      isDevModeOn: true,
      dayOffset: 3,
    });
    expect(sanitizeDevState({ isDevModeOn: 'yes', dayOffset: -2 })).toEqual({
      isDevModeOn: false,
      dayOffset: 0,
    });
    expect(sanitizeDevState({ dayOffset: 1.5 })).toEqual({ isDevModeOn: false, dayOffset: 0 });
    expect(sanitizeDevState({ dayOffset: 99999 }).dayOffset).toBe(MAX_DAY_OFFSET);
    expect(sanitizeDevState(undefined)).toEqual({ isDevModeOn: false, dayOffset: 0 });
  });
});

describe('useDevStore', () => {
  afterEach(() => useDevStore.setState({ isDevModeOn: false, dayOffset: 0 }));

  it('moves the clock forward one day at a time, up to the limit', () => {
    useDevStore.getState().advanceDay();
    useDevStore.getState().advanceDay();
    expect(useDevStore.getState().dayOffset).toBe(2);
    useDevStore.setState({ dayOffset: MAX_DAY_OFFSET });
    useDevStore.getState().advanceDay();
    expect(useDevStore.getState().dayOffset).toBe(MAX_DAY_OFFSET);
    useDevStore.getState().resetDayOffset();
    expect(useDevStore.getState().dayOffset).toBe(0);
  });
});
