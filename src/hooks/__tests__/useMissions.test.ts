import { act, renderHook, waitFor } from '@testing-library/react-native';

import { GLADIUS_RULES } from '@/features/aurora';

import { useGladius } from '../useGladius';
import { useMarch } from '../useMarch';

type StepListener = (result: { steps: number }) => void;
type MotionListener = (sample: { x: number; y: number; z: number; timestamp: number }) => void;

const mockSensors = {
  pedometerAvailable: true,
  granted: true,
  stepListener: null as StepListener | null,
  motionAvailable: true,
  motionListener: null as MotionListener | null,
  request: jest.fn(),
};

jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: async () => mockSensors.pedometerAvailable,
    getPermissionsAsync: async () => ({ granted: mockSensors.granted, canAskAgain: true }),
    requestPermissionsAsync: (...args: unknown[]) => mockSensors.request(...args),
    watchStepCount: (listener: StepListener) => {
      mockSensors.stepListener = listener;
      return { remove: () => (mockSensors.stepListener = null) };
    },
  },
  Accelerometer: {
    isAvailableAsync: async () => mockSensors.motionAvailable,
    setUpdateInterval: () => undefined,
    addListener: (listener: MotionListener) => {
      mockSensors.motionListener = listener;
      return { remove: () => (mockSensors.motionListener = null) };
    },
  },
}));

beforeEach(() => {
  mockSensors.pedometerAvailable = true;
  mockSensors.granted = true;
  mockSensors.motionAvailable = true;
  mockSensors.stepListener = null;
  mockSensors.motionListener = null;
  mockSensors.request.mockClear();
});

describe('useMarch', () => {
  it('counts steps, ignoring the start-up reading', async () => {
    const { result } = renderHook(() => useMarch());
    await waitFor(() => expect(result.current.mode).toBe('sensor'));
    act(() => mockSensors.stepListener?.({ steps: 1 }));
    expect(result.current.count).toBe(0);
    act(() => mockSensors.stepListener?.({ steps: 11 }));
    expect(result.current.count).toBe(10);
    expect(result.current.left).toBe(20);
  });

  it('never asks for the permission at ring time: taps instead', async () => {
    mockSensors.granted = false;
    const { result } = renderHook(() => useMarch());
    await waitFor(() => expect(result.current.mode).toBe('taps'));
    expect(result.current.fallback).toBe('noPermission');
    expect(mockSensors.request).not.toHaveBeenCalled();
    act(() => result.current.tap());
    expect(result.current.count).toBe(1);
  });

  it('taps when the phone has no step counter, and stops at the goal', async () => {
    mockSensors.pedometerAvailable = false;
    const { result } = renderHook(() => useMarch());
    await waitFor(() => expect(result.current.fallback).toBe('noSensor'));
    for (let k = 0; k < 40; k += 1) act(() => result.current.tap());
    expect(result.current.count).toBe(30);
    expect(result.current.isDone).toBe(true);
  });

  it('removes the step listener on unmount', async () => {
    const { result, unmount } = renderHook(() => useMarch());
    await waitFor(() => expect(result.current.mode).toBe('sensor'));
    unmount();
    expect(mockSensors.stepListener).toBeNull();
  });
});

describe('useGladius', () => {
  /** One full swing: a peak, then the reading settles. */
  const swing = (atSeconds: number) => {
    act(() => mockSensors.motionListener?.({ x: 0, y: 2.8, z: 0, timestamp: atSeconds }));
    act(() => mockSensors.motionListener?.({ x: 0, y: 1, z: 0, timestamp: atSeconds + 0.1 }));
  };

  it('counts swings from the accelerometer', async () => {
    const { result } = renderHook(() => useGladius());
    await waitFor(() => expect(result.current.mode).toBe('sensor'));
    for (let k = 0; k < 3; k += 1) swing(10 + k * 0.4);
    expect(result.current.count).toBe(3);
    expect(result.current.left).toBe(GLADIUS_RULES.swings - 3);
  });

  it('taps when there is no accelerometer', async () => {
    mockSensors.motionAvailable = false;
    const { result } = renderHook(() => useGladius());
    await waitFor(() => expect(result.current.mode).toBe('taps'));
    expect(result.current.fallback).toBe('noSensor');
  });

  it('offers taps after a minute, and swings still add', async () => {
    jest.useFakeTimers();
    try {
      const { result } = renderHook(() => useGladius());
      await waitFor(() => expect(result.current.mode).toBe('sensor'));
      swing(5);
      expect(result.current.canChooseTaps).toBe(false);
      act(() => jest.advanceTimersByTime(GLADIUS_RULES.tapOfferMs));
      expect(result.current.canChooseTaps).toBe(true);
      act(() => result.current.chooseTaps());
      act(() => result.current.tap());
      expect(result.current.count).toBe(2);
      expect(result.current.fallback).toBe('chosen');
    } finally {
      jest.useRealTimers();
    }
  });
});
