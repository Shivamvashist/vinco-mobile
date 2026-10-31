import { REMINDER_ID_PREFIX } from '@/features/notifications';

import {
  clampFocusMinutes,
  expectedFocusReward,
  FOCUS_NOTIFICATION_ID_PREFIX,
  FOCUS_RULES,
  focusEndsAt,
  focusReward,
  formatFocusClock,
  getFocusOutcome,
  getFocusState,
  getTrustedNow,
  isFocusGuard,
  nextFocusReason,
  remainingMs,
  remainingShare,
  snapRulerMinutes,
} from '..';

const START = new Date('2026-10-31T10:00:00.000Z');
const at = (minutes: number) => new Date(START.getTime() + minutes * 60_000);
const session = (minutes = 25) => ({
  startedAt: START.toISOString(),
  endsAt: at(minutes).toISOString(),
  status: 'running' as const,
});

describe('focus lengths', () => {
  it('keeps a custom length between 5 and 180 in whole minutes', () => {
    expect(clampFocusMinutes(25)).toBe(25);
    expect(clampFocusMinutes(27)).toBe(27);
    expect(clampFocusMinutes(67.4)).toBe(67);
    expect(clampFocusMinutes(0)).toBe(5);
    expect(clampFocusMinutes(4)).toBe(5);
    expect(clampFocusMinutes(-20)).toBe(5);
    expect(clampFocusMinutes(181)).toBe(180);
    expect(clampFocusMinutes(1000)).toBe(180);
  });

  it('keeps the ruler on 5-minute steps', () => {
    expect(snapRulerMinutes(27)).toBe(25);
    expect(snapRulerMinutes(28)).toBe(30);
    expect(snapRulerMinutes(2)).toBe(5);
    expect(snapRulerMinutes(190)).toBe(180);
  });

  it('falls back to the default for bad values', () => {
    for (const clamp of [clampFocusMinutes, snapRulerMinutes]) {
      expect(clamp(Number.NaN)).toBe(FOCUS_RULES.defaultMinutes);
      expect(clamp('25')).toBe(FOCUS_RULES.defaultMinutes);
      expect(clamp(null)).toBe(FOCUS_RULES.defaultMinutes);
    }
  });

  it('has presets on the ruler: 15m, 25m, 45m, 1h, 1h 30m, 2h', () => {
    expect(FOCUS_RULES.presets).toEqual([15, 25, 45, 60, 90, 120]);
    for (const preset of FOCUS_RULES.presets) expect(snapRulerMinutes(preset)).toBe(preset);
  });

  it('ends a custom-length focus after exactly its minutes', () => {
    expect(focusEndsAt(START, 67)).toEqual(at(67));
  });
});

describe('focusReward', () => {
  it('pays the spec examples', () => {
    expect(focusReward(25, 'imperium')).toBe(8);
    expect(focusReward(60, 'silentium')).toBe(24);
    expect(focusReward(120, 'silentium')).toBe(48);
    expect(focusReward(25, 'custos')).toBe(5);
  });

  it('pays nothing under 10 minutes and counts at most 120', () => {
    expect(focusReward(5, 'silentium')).toBe(0);
    expect(focusReward(10, 'custos')).toBe(2);
    expect(focusReward(180, 'silentium')).toBe(48);
    expect(focusReward(Number.NaN, 'imperium')).toBe(0);
  });

  it('pays nothing once three sessions were rewarded today', () => {
    expect(expectedFocusReward(25, 'imperium', 2)).toBe(8);
    expect(expectedFocusReward(25, 'imperium', 3)).toBe(0);
  });
});

describe('nextFocusReason', () => {
  it('hands out focus_1 to focus_3 in order, then null', () => {
    expect(nextFocusReason([])).toBe('focus_1');
    expect(nextFocusReason(['focus_1'])).toBe('focus_2');
    expect(nextFocusReason(['focus_2'])).toBe('focus_1');
    expect(nextFocusReason(['focus_1', 'focus_2', 'focus_3'])).toBeNull();
    expect(nextFocusReason(['day_held'])).toBe('focus_1');
  });
});

describe('getFocusState', () => {
  it('runs until the end, then is due', () => {
    expect(getFocusState(session(), at(0))).toBe('running');
    expect(getFocusState(session(), at(24.99))).toBe('running');
    expect(getFocusState(session(), at(25))).toBe('due');
    expect(getFocusState(session(), at(600))).toBe('due');
  });

  it('never completes when the clock was set back before the start', () => {
    expect(getFocusState(session(), at(-60))).toBe('running');
  });

  it('keeps finished sessions finished, and never completes unreadable dates', () => {
    expect(getFocusState({ ...session(), status: 'completed' }, at(0))).toBe('completed');
    expect(getFocusState({ ...session(), status: 'abandoned' }, at(30))).toBe('abandoned');
    expect(getFocusState({ ...session(), endsAt: 'nonsense' }, at(30))).toBe('running');
  });
});

describe('time left', () => {
  it('counts down and stops at zero', () => {
    expect(remainingMs(session(), at(0))).toBe(25 * 60_000);
    expect(remainingMs(session(), at(30))).toBe(0);
    expect(remainingShare(session(), at(0))).toBe(1);
    expect(remainingShare(session(), at(12.5))).toBeCloseTo(0.5);
    expect(remainingShare(session(), at(-5))).toBe(1);
    expect(remainingShare(session(), at(40))).toBe(0);
  });

  it('ends a focus started now after its minutes', () => {
    expect(focusEndsAt(START, 25).toISOString()).toBe(at(25).toISOString());
    expect(focusEndsAt(START, 1).toISOString()).toBe(at(5).toISOString());
  });

  it('formats the clock', () => {
    expect(formatFocusClock(25 * 60_000)).toBe('25:00');
    expect(formatFocusClock(61_001)).toBe('01:02');
    expect(formatFocusClock(500)).toBe('00:01');
    expect(formatFocusClock(0)).toBe('00:00');
    expect(formatFocusClock(-5)).toBe('00:00');
    expect(formatFocusClock(90 * 60_000)).toBe('1:30:00');
  });
});

describe('getTrustedNow', () => {
  const anchor = { wallMs: START.getTime(), monotonicMs: 1000 };

  it('uses the wall clock when it agrees with the measured time', () => {
    const wall = at(10);
    expect(getTrustedNow(wall, anchor, 1000 + 10 * 60_000).getTime()).toBe(wall.getTime());
  });

  it('refuses a clock set forward while the app stayed open', () => {
    // An hour on the wall clock, one minute measured.
    const trusted = getTrustedNow(at(60), anchor, 1000 + 60_000);
    expect(trusted.getTime()).toBe(START.getTime() + 60_000 + FOCUS_RULES.clockToleranceMs);
    expect(getFocusState(session(), trusted)).toBe('running');
  });

  it('falls back to the wall clock without an anchor or with a broken reading', () => {
    expect(getTrustedNow(at(60), null, 5).getTime()).toBe(at(60).getTime());
    expect(getTrustedNow(at(60), anchor, 10).getTime()).toBe(at(60).getTime());
  });
});

describe('outcomes and guards', () => {
  it('says why a finished focus paid what it did', () => {
    expect(getFocusOutcome({ status: 'running', reward: 0, minutes: 25 })).toBeNull();
    expect(getFocusOutcome({ status: 'abandoned', reward: 0, minutes: 25 })).toBe('retreated');
    expect(getFocusOutcome({ status: 'completed', reward: 8, minutes: 25 })).toBe('paid');
    expect(getFocusOutcome({ status: 'completed', reward: 0, minutes: 5 })).toBe('tooShort');
    expect(getFocusOutcome({ status: 'completed', reward: 0, minutes: 25 })).toBe('dailyLimit');
  });

  it('times the native guards in 3-minute steps', () => {
    expect(FOCUS_RULES.nudgeEveryMinutes).toBe(3);
    expect(FOCUS_RULES.appSessionMinutes).toBe(3);
    expect(FOCUS_RULES.appCooldownMinutes).toBe(3);
    expect(isFocusGuard('silentium')).toBe(true);
    expect(isFocusGuard('pax')).toBe(false);
  });

  it('keeps the focus notification apart from the reminders', () => {
    expect(FOCUS_NOTIFICATION_ID_PREFIX.startsWith(REMINDER_ID_PREFIX)).toBe(false);
    expect(REMINDER_ID_PREFIX.startsWith(FOCUS_NOTIFICATION_ID_PREFIX)).toBe(false);
  });
});
