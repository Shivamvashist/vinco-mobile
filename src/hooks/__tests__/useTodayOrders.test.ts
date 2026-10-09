import { act, renderHook } from '@testing-library/react-native';

import { useTodayOrders, WORKOUT_NOTE_MAX_LENGTH } from '../useTodayOrders';

let mockToday = '2026-10-17';
jest.mock('../useToday', () => ({ useToday: () => mockToday }));

beforeEach(() => {
  mockToday = '2026-10-17';
});

function holdAllFour(result: { current: ReturnType<typeof useTodayOrders> }) {
  act(() => {
    result.current.addOne('water');
    result.current.addOne('wake');
    result.current.addOne('meal');
    result.current.logWorkout(15, '');
  });
}

describe('useTodayOrders', () => {
  it('starts the day empty', () => {
    const { result } = renderHook(() => useTodayOrders());
    expect(result.current.heldCount).toBe(0);
    expect(result.current.statuses.water).toBe('none');
    expect(result.current.isStampVisible).toBe(false);
  });

  it('counts every tap even when taps land before a re-render', () => {
    const { result } = renderHook(() => useTodayOrders());
    act(() => {
      result.current.addOne('water');
      result.current.addOne('water');
      result.current.addOne('water');
    });
    expect(result.current.amounts.water).toBe(3);
  });

  it('returns the new status so the screen can choose the sound', () => {
    const { result } = renderHook(() => useTodayOrders());
    let status = 'none';
    act(() => {
      status = result.current.addOne('meal');
    });
    expect(status).toBe('min');
    act(() => {
      status = result.current.addOne('meal');
    });
    expect(status).toBe('full');
  });

  it('never goes past the full goal or below zero', () => {
    const { result } = renderHook(() => useTodayOrders());
    act(() => {
      for (let i = 0; i < 10; i += 1) result.current.addOne('water');
    });
    expect(result.current.amounts.water).toBe(4);
    act(() => {
      for (let i = 0; i < 10; i += 1) result.current.undoOne('water');
    });
    expect(result.current.amounts.water).toBe(0);
  });

  it('records the wake-up time and clears it on undo', () => {
    const { result } = renderHook(() => useTodayOrders());
    act(() => {
      result.current.addOne('wake');
    });
    expect(result.current.wokeAt).toBeInstanceOf(Date);
    act(() => {
      result.current.undoOne('wake');
    });
    expect(result.current.wokeAt).toBeNull();
  });

  it('shows the stamp once when all four are held, and not again after undo and redo', () => {
    const { result } = renderHook(() => useTodayOrders());
    holdAllFour(result);
    expect(result.current.isStampVisible).toBe(true);

    act(() => result.current.dismissStamp());
    act(() => {
      result.current.undoOne('water');
      result.current.addOne('water');
    });
    expect(result.current.isStampVisible).toBe(false);
  });

  it('trims and shortens the workout note, and clears it when the workout is undone', () => {
    const { result } = renderHook(() => useTodayOrders());
    act(() => {
      result.current.logWorkout(40, `  ${'x'.repeat(200)}  `);
    });
    expect(result.current.workoutNote).toHaveLength(WORKOUT_NOTE_MAX_LENGTH);
    expect(result.current.statuses.workout).toBe('full');
    act(() => {
      result.current.undoOne('workout');
    });
    expect(result.current.workoutNote).toBe('');
  });

  it('keeps progress after the app restarts', () => {
    const first = renderHook(() => useTodayOrders());
    act(() => {
      first.result.current.addOne('water');
      first.result.current.addOne('water');
      first.result.current.logWorkout(40, 'Legs');
    });
    first.unmount();

    const { result } = renderHook(() => useTodayOrders());
    expect(result.current.amounts.water).toBe(2);
    expect(result.current.workoutNote).toBe('Legs');
    expect(result.current.statuses.workout).toBe('full');
  });

  it('does not replay the stamp after a restart on a day it already showed', () => {
    const first = renderHook(() => useTodayOrders());
    holdAllFour(first.result);
    expect(first.result.current.isStampVisible).toBe(true);
    first.unmount();

    const { result } = renderHook(() => useTodayOrders());
    expect(result.current.isStampVisible).toBe(false);
    act(() => {
      result.current.undoOne('meal');
      result.current.addOne('meal');
    });
    expect(result.current.isStampVisible).toBe(false);
  });

  it('reports loaded once rows are read', () => {
    const { result } = renderHook(() => useTodayOrders());
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.hasSaveError).toBe(false);
  });

  it('starts a fresh day at midnight', () => {
    const { result, rerender } = renderHook(() => useTodayOrders());
    holdAllFour(result);
    expect(result.current.heldCount).toBe(4);

    mockToday = '2026-10-18';
    rerender({});
    expect(result.current.today).toBe('2026-10-18');
    expect(result.current.heldCount).toBe(0);
    expect(result.current.isStampVisible).toBe(false);

    act(() => {
      result.current.addOne('water');
    });
    expect(result.current.amounts.water).toBe(1);
  });
});
