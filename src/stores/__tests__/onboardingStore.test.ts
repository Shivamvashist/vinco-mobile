import { act } from '@testing-library/react-native';

import { DEFAULT_ONBOARDING_DRAFT, getStepPosition, sanitizeOnboardingDraft, useOnboardingStore } from '..';

beforeEach(() => {
  act(() => useOnboardingStore.getState().reset());
});

describe('sanitizeOnboardingDraft', () => {
  it('returns the defaults for nothing or garbage', () => {
    expect(sanitizeOnboardingDraft(undefined)).toEqual(DEFAULT_ONBOARDING_DRAFT);
    expect(sanitizeOnboardingDraft('broken')).toEqual(DEFAULT_ONBOARDING_DRAFT);
  });

  it('keeps valid choices and repairs invalid ones', () => {
    const draft = sanitizeOnboardingDraft({
      arcLength: 90,
      fullGoals: { water: 3.5, meal: 9, workout: 'lots' },
      wakeMinutes: 6 * 60 + 7,
      oathPath: '',
      lastStep: 'tone',
      picks: ['workout', 'meal', 'water'],
      ownOrders: [
        { name: ' Read ', unit: 'pages', min: 10, full: 10 },
        { name: '', unit: '', min: 1, full: 1 },
        'junk',
      ],
    });
    expect(draft).toEqual({
      arcKind: 'ludus',
      arcLength: 90,
      picks: ['water', 'workout'],
      ownOrders: [{ name: 'Read', unit: 'pages', min: 10, full: 10 }],
      fullGoals: { water: 3.5, meal: 3, workout: 40 },
      wakeMinutes: 6 * 60,
      oathPath: null,
      lastStep: 'tone',
    });
  });

  it('rejects unknown arc lengths, kinds and steps', () => {
    const draft = sanitizeOnboardingDraft({ arcLength: 45, arcKind: 'holiday', lastStep: 'payment' });
    expect(draft.arcLength).toBe(60);
    expect(draft.arcKind).toBe('ludus');
    expect(draft.lastStep).toBeNull();
  });
});

describe('useOnboardingStore', () => {
  it('keeps tuned goals inside their ranges', () => {
    act(() => {
      useOnboardingStore.getState().setFullGoal('water', 12);
      useOnboardingStore.getState().setFullGoal('workout', 33);
      useOnboardingStore.getState().setWakeMinutes(2 * 60);
    });
    const state = useOnboardingStore.getState();
    expect(state.fullGoals.water).toBe(5);
    expect(state.fullGoals.workout).toBe(35);
    expect(state.wakeMinutes).toBe(4 * 60);
  });

  it('adds suggested and own orders, refusing a bad one', () => {
    act(() => useOnboardingStore.getState().togglePick('workout'));
    act(() => useOnboardingStore.getState().togglePick('water'));
    expect(useOnboardingStore.getState().picks).toEqual(['water', 'workout']);
    act(() => useOnboardingStore.getState().togglePick('workout'));
    expect(useOnboardingStore.getState().picks).toEqual(['water']);

    let error: unknown = 'unset';
    act(() => {
      error = useOnboardingStore.getState().addOwnOrder({ name: 'Water', unit: 'glass', min: 12, full: 12 });
    });
    expect(error).toBeNull();
    act(() => {
      error = useOnboardingStore.getState().addOwnOrder({ name: '  ', unit: '', min: 1, full: 1 });
    });
    expect(error).toBe('nameMissing');
    act(() => useOnboardingStore.getState().removeOwnOrder(0));
    expect(useOnboardingStore.getState().ownOrders).toEqual([]);
  });

  it('numbers steps by path', () => {
    expect(getStepPosition('plan', 'ludus')).toEqual({ step: 1, total: 4 });
    expect(getStepPosition('selfie', 'ludus')).toEqual({ step: 4, total: 4 });
    expect(getStepPosition('arc', 'campaign')).toEqual({ step: 2, total: 6 });
    expect(getStepPosition('oath', 'campaign')).toEqual({ step: 5, total: 6 });
  });

  it('picks free training, and a length picks a campaign again', () => {
    act(() => useOnboardingStore.getState().chooseLudus());
    expect(useOnboardingStore.getState().arcKind).toBe('ludus');
    act(() => useOnboardingStore.getState().setArcLength(30));
    expect(useOnboardingStore.getState()).toMatchObject({ arcKind: 'campaign', arcLength: 30 });
  });

  it('resets to the defaults', () => {
    act(() => {
      useOnboardingStore.getState().setArcLength(30);
      useOnboardingStore.getState().setLastStep('oath');
      useOnboardingStore.getState().reset();
    });
    expect(useOnboardingStore.getState().arcLength).toBe(60);
    expect(useOnboardingStore.getState().lastStep).toBeNull();
  });
});
