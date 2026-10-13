import { act } from '@testing-library/react-native';

import { DEFAULT_GUARD_STATE, sanitizeGuardState, useGuardStore } from '../guardStore';

describe('guard store', () => {
  beforeEach(() => useGuardStore.getState().reset());

  it('restores only valid choices', () => {
    expect(sanitizeGuardState({ level: 'tyrant', reelBudget: 3 })).toMatchObject({
      level: 'pax',
      reelBudget: 5,
    });
    expect(sanitizeGuardState('broken').level).toBe(DEFAULT_GUARD_STATE.level);
  });

  it('sets the level and keeps Aurora valid on update', () => {
    act(() => {
      useGuardStore.getState().setLevel('vigil');
      useGuardStore.getState().updateAurora({ isOn: true, minutes: 330 });
    });
    expect(useGuardStore.getState().level).toBe('vigil');
    expect(useGuardStore.getState().aurora).toMatchObject({ isOn: true, minutes: 330 });
  });
});
