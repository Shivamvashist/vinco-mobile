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

  it('keeps up to three focus Comites, restored safely from an old or broken save', () => {
    const app = (name: string) => ({ packageName: `com.example.${name}`, label: name, icon: null });
    act(() => {
      for (const name of ['notes', 'maps', 'music', 'books']) useGuardStore.getState().toggleComes(app(name));
    });
    expect(useGuardStore.getState().comites.map((comes) => comes.label)).toEqual(['notes', 'maps', 'music']);
    act(() => useGuardStore.getState().toggleComes(app('maps')));
    expect(useGuardStore.getState().comites).toHaveLength(2);
    // A version 1 save has no Comites; a broken one keeps none.
    expect(sanitizeGuardState({ level: 'pax' }).comites).toEqual([]);
    expect(sanitizeGuardState({ comites: 'oops' }).comites).toEqual([]);
  });
});
