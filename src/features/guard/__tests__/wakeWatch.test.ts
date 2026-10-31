import { isInWakeWindow, planWakeWatch, shouldPromptWake, WAKE_PROMPT } from '../wakeWatch';

const TODAY = '2026-11-01';
const YESTERDAY = '2026-10-31';

describe('wake prompt window', () => {
  it('runs from 03:00 up to, not including, 12:00', () => {
    expect(WAKE_PROMPT).toEqual({ fromMinutes: 180, untilMinutes: 720 });
    expect(isInWakeWindow(179)).toBe(false);
    expect(isInWakeWindow(180)).toBe(true);
    expect(isInWakeWindow(719)).toBe(true);
    expect(isInWakeWindow(720)).toBe(false);
    expect(isInWakeWindow(0)).toBe(false);
  });
});

describe('shouldPromptWake (the native rule)', () => {
  const base = { enabled: true, minutes: 7 * 60, today: TODAY, awakeDay: YESTERDAY, promptedDay: null };

  it('prompts on an unlock in the window when wake-up is not logged today', () => {
    expect(shouldPromptWake(base)).toBe(true);
    expect(shouldPromptWake({ ...base, awakeDay: null })).toBe(true);
  });

  it('stays quiet when off, outside the window, already up, or already prompted today', () => {
    expect(shouldPromptWake({ ...base, enabled: false })).toBe(false);
    expect(shouldPromptWake({ ...base, minutes: 2 * 60 + 59 })).toBe(false);
    expect(shouldPromptWake({ ...base, minutes: 13 * 60 })).toBe(false);
    expect(shouldPromptWake({ ...base, awakeDay: TODAY })).toBe(false);
    expect(shouldPromptWake({ ...base, promptedDay: TODAY })).toBe(false);
  });

  it('prompts again the day after a prompt', () => {
    expect(shouldPromptWake({ ...base, promptedDay: YESTERDAY })).toBe(true);
  });
});

describe('planWakeWatch (what the app sends)', () => {
  const base = {
    hasArc: true,
    arcHasWake: true,
    remindersOn: true,
    today: TODAY,
    isWakeLogged: false,
    isSickDay: false,
  };

  it('is on with an arc that has wake-up and reminders on', () => {
    expect(planWakeWatch(base)).toEqual({ enabled: true, awakeDay: null });
  });

  it('is off without an arc, without the wake-up order, or with reminders off', () => {
    expect(planWakeWatch({ ...base, hasArc: false }).enabled).toBe(false);
    expect(planWakeWatch({ ...base, arcHasWake: false }).enabled).toBe(false);
    expect(planWakeWatch({ ...base, remindersOn: false }).enabled).toBe(false);
  });

  it('marks today as up once wake-up is logged, or on a sick day', () => {
    expect(planWakeWatch({ ...base, isWakeLogged: true }).awakeDay).toBe(TODAY);
    expect(planWakeWatch({ ...base, isSickDay: true }).awakeDay).toBe(TODAY);
  });
});
