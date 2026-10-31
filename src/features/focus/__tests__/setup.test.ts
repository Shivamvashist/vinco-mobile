import { focusGloria } from '@/features/gloria';

import {
  allowedPackagesFor,
  focusRetreatReason,
  formatHoursMinutes,
  heldMinutes,
  isFocusRetreatReason,
  minutesAtOffset,
  parseCustomMinutes,
  planRetreatPayment,
  rulerIndex,
  sanitizeComites,
  shouldWarnNoTruce,
  splitFocusClock,
  splitHoursMinutes,
  standDownLeftMs,
  summarizeFocusLog,
  toggleComes,
  weekStartOf,
} from '..';

const TICK = 16;

describe('the ruler', () => {
  it('reads the tick under the centre from the scroll offset', () => {
    expect(minutesAtOffset(0, TICK)).toBe(5);
    expect(minutesAtOffset(TICK * 4, TICK)).toBe(25);
    // Between ticks: the nearest one, as the snap will land.
    expect(minutesAtOffset(TICK * 4 + 7, TICK)).toBe(25);
    expect(minutesAtOffset(TICK * 4 + 9, TICK)).toBe(30);
  });

  it('never leaves the range when overscrolled or broken', () => {
    expect(minutesAtOffset(-200, TICK)).toBe(5);
    expect(minutesAtOffset(TICK * 999, TICK)).toBe(180);
    expect(minutesAtOffset(Number.NaN, TICK)).toBe(25);
    expect(minutesAtOffset(40, 0)).toBe(25);
  });

  it('places a length on its tick, and a custom length on the nearest one', () => {
    expect(rulerIndex(5)).toBe(0);
    expect(rulerIndex(25)).toBe(4);
    expect(rulerIndex(180)).toBe(35);
    expect(rulerIndex(67)).toBe(rulerIndex(65));
    expect(minutesAtOffset(rulerIndex(90) * TICK, TICK)).toBe(90);
  });
});

describe('h:mm', () => {
  it('formats a length', () => {
    expect(formatHoursMinutes(25)).toBe('0:25');
    expect(formatHoursMinutes(60)).toBe('1:00');
    expect(formatHoursMinutes(67)).toBe('1:07');
    expect(formatHoursMinutes(180)).toBe('3:00');
    expect(formatHoursMinutes(Number.NaN)).toBe('0:00');
  });

  it('splits the time left into h:mm and seconds, counting whole seconds up', () => {
    expect(splitFocusClock(25 * 60_000)).toEqual({ hoursMinutes: '0:25', seconds: '00' });
    expect(splitFocusClock(90 * 60_000 - 500)).toEqual({ hoursMinutes: '1:30', seconds: '00' });
    expect(splitFocusClock(61_001)).toEqual({ hoursMinutes: '0:01', seconds: '02' });
    expect(splitFocusClock(-5)).toEqual({ hoursMinutes: '0:00', seconds: '00' });
  });
});

describe('custom length', () => {
  it('takes any whole minute from 5 to 180', () => {
    expect(parseCustomMinutes('0', '5')).toBe(5);
    expect(parseCustomMinutes('1', '7')).toBe(67);
    expect(parseCustomMinutes('', '45')).toBe(45);
    expect(parseCustomMinutes('3', '0')).toBe(180);
    expect(parseCustomMinutes(' 2 ', '')).toBe(120);
  });

  it('refuses too short, too long and anything not whole', () => {
    expect(parseCustomMinutes('0', '4')).toBeNull();
    expect(parseCustomMinutes('', '')).toBeNull();
    expect(parseCustomMinutes('3', '1')).toBeNull();
    expect(parseCustomMinutes('1', '2.5')).toBeNull();
    expect(parseCustomMinutes('-1', '30')).toBeNull();
    expect(parseCustomMinutes('a', '30')).toBeNull();
  });

  it('prefills hours and minutes', () => {
    expect(splitHoursMinutes(67)).toEqual({ hours: 1, minutes: 7 });
    expect(splitHoursMinutes(25)).toEqual({ hours: 0, minutes: 25 });
    expect(splitHoursMinutes(999)).toEqual({ hours: 3, minutes: 0 });
  });
});

describe('retreat', () => {
  it('pays with a Truce first, then 50 denarii, else the stand-down', () => {
    expect(planRetreatPayment(1, 0)).toBe('truce');
    expect(planRetreatPayment(2, 500)).toBe('truce');
    expect(planRetreatPayment(0, 50)).toBe('denarii');
    expect(planRetreatPayment(0, 49)).toBe('standDown');
    expect(planRetreatPayment(0, -10)).toBe('standDown');
    expect(planRetreatPayment(Number.NaN, Number.NaN)).toBe('standDown');
  });

  it('warns before a focus only when no Truce is held', () => {
    expect(shouldWarnNoTruce(0)).toBe(true);
    expect(shouldWarnNoTruce(1)).toBe(false);
  });

  it('keys each retreat by its session', () => {
    expect(focusRetreatReason(12)).toBe('focus_retreat_12');
    expect(isFocusRetreatReason('focus_retreat_12')).toBe(true);
    expect(isFocusRetreatReason('focus_1')).toBe(false);
  });

  it('counts the stand-down down from 30 seconds, never past it', () => {
    expect(standDownLeftMs(0, 0)).toBe(30_000);
    expect(standDownLeftMs(0, 12_000)).toBe(18_000);
    expect(standDownLeftMs(0, 31_000)).toBe(0);
    // The clock moved back: still the full stand-down, never more.
    expect(standDownLeftMs(10_000, 0)).toBe(30_000);
  });
});

describe('Comites', () => {
  const notes = { packageName: 'org.example.notes', label: 'Notes', icon: 'data:image/png;base64,AAA' };
  const maps = { packageName: 'com.example.maps', label: 'Maps', icon: null };
  const music = { packageName: 'com.example.music', label: 'Music', icon: null };
  const books = { packageName: 'com.example.books', label: 'Books', icon: null };

  it('restores only valid, distinct apps, at most three', () => {
    expect(sanitizeComites([notes, maps, notes, music, books])).toEqual([notes, maps, music]);
    expect(sanitizeComites('broken')).toEqual([]);
    expect(sanitizeComites(null)).toEqual([]);
    expect(
      sanitizeComites([
        { packageName: 'not a package', label: 'X' },
        { packageName: 'com.example.x', label: '  ', icon: 'javascript:alert(1)' },
        42,
      ]),
    ).toEqual([{ packageName: 'com.example.x', label: 'com.example.x', icon: null }]);
  });

  it('adds and removes, and never adds a fourth', () => {
    const three = toggleComes(toggleComes(toggleComes([], notes), maps), music);
    expect(three).toHaveLength(3);
    expect(toggleComes(three, books)).toEqual(three);
    expect(toggleComes(three, maps)).toEqual([notes, music]);
  });

  it('allows the Comites and the Phone app', () => {
    expect(allowedPackagesFor([notes, maps], 'com.google.android.dialer')).toEqual([
      'org.example.notes',
      'com.example.maps',
      'com.google.android.dialer',
    ]);
    expect(allowedPackagesFor([], null)).toEqual([]);
    expect(allowedPackagesFor([notes], 'org.example.notes')).toEqual(['org.example.notes']);
  });
});

describe('focus log and Gloria', () => {
  // 2026-10-31 is a Saturday; its week began on Monday 26 October.
  const TODAY = '2026-10-31';

  it('starts the week on Monday', () => {
    expect(weekStartOf(TODAY)).toBe('2026-10-26');
    expect(weekStartOf('2026-10-26')).toBe('2026-10-26');
    expect(weekStartOf('2026-11-01')).toBe('2026-10-26');
  });

  it('counts only focuses held to the end', () => {
    const totals = summarizeFocusLog(
      [
        { day: TODAY, minutes: 25, status: 'completed' },
        { day: TODAY, minutes: 60, status: 'abandoned' },
        { day: TODAY, minutes: 45, status: 'running' },
        { day: '2026-10-27', minutes: 90, status: 'completed' },
        { day: '2026-10-20', minutes: 30, status: 'completed' },
      ],
      TODAY,
    );
    expect(totals).toEqual({ today: 25, week: 115, allTime: 145 });
    expect(summarizeFocusLog([], TODAY)).toEqual({ today: 0, week: 0, allTime: 0 });
  });

  it('gives one glory point a minute held, none for a retreat', () => {
    expect(focusGloria(heldMinutes({ minutes: 25, status: 'completed' }))).toBe(25);
    expect(focusGloria(heldMinutes({ minutes: 25, status: 'abandoned' }))).toBe(0);
    expect(focusGloria(heldMinutes({ minutes: 25, status: 'running' }))).toBe(0);
    expect(focusGloria(Number.NaN)).toBe(0);
  });
});
