import { DEFAULT_AURORA_SETTINGS } from '../aurora';
import { auroraBridge, createNativeAuroraBridge, unsupportedAuroraBridge } from '../bridge';
import {
  earnsFirstTry,
  isMissionBuilt,
  isSamePlan,
  missionToRun,
  planAuroraRing,
  toDaysMask,
} from '../schedule';
import { marchLeft } from '../march';

// Wednesday 14 October 2026.
const at = (hours: number, minutes = 0, day = 14) => new Date(2026, 9, day, hours, minutes);
const on = { ...DEFAULT_AURORA_SETTINGS, isOn: true, minutes: 6 * 60 + 30 };

describe('toDaysMask', () => {
  it('sets one bit per weekday, Monday first', () => {
    expect(toDaysMask([0])).toBe(1);
    expect(toDaysMask([6])).toBe(64);
    expect(toDaysMask([0, 1, 2, 3, 4, 5, 6])).toBe(127);
    expect(toDaysMask([])).toBe(0);
  });
});

describe('planAuroraRing', () => {
  it('cancels when Aurora is off or has no days', () => {
    expect(planAuroraRing(DEFAULT_AURORA_SETTINGS, at(5))).toEqual({ kind: 'cancel' });
    expect(planAuroraRing({ ...on, days: [] }, at(5))).toEqual({ kind: 'cancel' });
  });

  it('schedules the next ring with the repeat rule', () => {
    expect(planAuroraRing({ ...on, days: [0, 2] }, at(7))).toEqual({
      kind: 'schedule',
      ringAt: at(6, 30, 19),
      minutes: 390,
      daysMask: 5,
    });
  });
});

describe('isSamePlan', () => {
  const plan = planAuroraRing(on, at(5));

  it('matches the same ring and the same rule only', () => {
    expect(isSamePlan(null, plan)).toBe(false);
    expect(isSamePlan(plan, planAuroraRing(on, at(5, 30)))).toBe(true);
    expect(isSamePlan(plan, planAuroraRing(on, at(7)))).toBe(false);
    expect(isSamePlan(plan, planAuroraRing({ ...on, days: [2] }, at(5)))).toBe(false);
    expect(isSamePlan({ kind: 'cancel' }, { kind: 'cancel' })).toBe(true);
    expect(isSamePlan({ kind: 'cancel' }, plan)).toBe(false);
  });
});

describe('missions', () => {
  it('runs the march for missions not built yet', () => {
    expect(isMissionBuilt('march')).toBe(true);
    expect(isMissionBuilt('sky')).toBe(false);
    expect(missionToRun('sky')).toBe('march');
    expect(missionToRun('post')).toBe('march');
    expect(missionToRun('march')).toBe('march');
    expect(isMissionBuilt('gladius')).toBe(true);
    expect(missionToRun('gladius')).toBe('gladius');
  });

  it('counts the march down to zero and never below', () => {
    expect(marchLeft(0)).toBe(30);
    expect(marchLeft(12)).toBe(18);
    expect(marchLeft(30)).toBe(0);
    expect(marchLeft(45)).toBe(0);
    expect(marchLeft(-3)).toBe(30);
    expect(marchLeft(Number.NaN)).toBe(30);
  });

  it('pays the first try only for the mission while still ringing', () => {
    expect(earnsFirstTry('mission', true)).toBe(true);
    expect(earnsFirstTry('mission', false)).toBe(false);
    expect(earnsFirstTry('pass', true)).toBe(false);
    expect(earnsFirstTry('sick', true)).toBe(false);
  });
});

describe('auroraBridge', () => {
  it('is the unsupported stub where the native module is missing (tests, Expo Go)', async () => {
    expect(auroraBridge).toBe(unsupportedAuroraBridge);
    expect(auroraBridge.isSupported).toBe(false);
    await expect(auroraBridge.isRinging()).resolves.toBe(false);
    await expect(auroraBridge.getNextRing()).resolves.toBeNull();
    expect(() => auroraBridge.onRing(() => undefined)()).not.toThrow();
  });

  it('wraps the native module: dates as epoch millis, one-off rings without a rule', async () => {
    const remove = jest.fn();
    const native = {
      canScheduleExact: jest.fn(async () => true),
      openExactAlarmSettings: jest.fn(async () => undefined),
      canUseFullScreenIntent: jest.fn(async () => true),
      openFullScreenIntentSettings: jest.fn(async () => undefined),
      areNotificationsEnabled: jest.fn(async () => true),
      openNotificationSettings: jest.fn(async () => undefined),
      schedule: jest.fn(async () => undefined),
      cancel: jest.fn(async () => undefined),
      getNextRing: jest.fn(async () => at(6, 30).getTime()),
      isRinging: jest.fn(async () => true),
      stopRinging: jest.fn(async () => undefined),
      addListener: jest.fn(() => ({ remove })),
    };
    const bridge = createNativeAuroraBridge(native);
    const notice = {
      channelName: 'c',
      title: 't',
      body: 'b',
      action: 'a',
      timedOutTitle: 'tt',
      timedOutBody: 'tb',
    };
    expect(bridge.isSupported).toBe(true);
    await bridge.schedule(at(6, 30), notice, { minutes: 390, daysMask: 127 });
    expect(native.schedule).toHaveBeenLastCalledWith(at(6, 30).getTime(), {
      ...notice,
      minutes: 390,
      daysMask: 127,
    });
    await bridge.schedule(at(6, 30), notice);
    expect(native.schedule).toHaveBeenLastCalledWith(at(6, 30).getTime(), {
      ...notice,
      minutes: -1,
      daysMask: 0,
    });
    await expect(bridge.getNextRing()).resolves.toEqual(at(6, 30));
    const listener = jest.fn();
    const unsubscribe = bridge.onRing(listener);
    expect(native.addListener).toHaveBeenCalledWith('onRing', expect.any(Function));
    unsubscribe();
    expect(remove).toHaveBeenCalled();
  });
});
