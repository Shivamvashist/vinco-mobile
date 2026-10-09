import { act } from '@testing-library/react-native';

import { DEFAULT_ONBOARDING_DRAFT, sanitizeOnboardingDraft, useOnboardingStore } from '..';

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
    });
    expect(draft).toEqual({
      arcLength: 90,
      fullGoals: { water: 3.5, meal: 3, workout: 40 },
      wakeMinutes: 6 * 60,
      oathPath: null,
      lastStep: 'tone',
    });
  });

  it('rejects unknown arc lengths and steps', () => {
    const draft = sanitizeOnboardingDraft({ arcLength: 45, lastStep: 'payment' });
    expect(draft.arcLength).toBe(60);
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
