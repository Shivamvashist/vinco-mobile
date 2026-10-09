import {
  clockMinutesOf,
  SLEEP,
  sleepMinutesBetween,
  sleepMinutesFromMoments,
  toWakeMoments,
  validateWake,
} from '..';

const at = (hours: number, minutes = 0) => hours * 60 + minutes;

describe('sleepMinutesBetween', () => {
  it('crosses midnight when bedtime is later in the clock', () => {
    expect(sleepMinutesBetween(at(23), at(6, 30))).toBe(450);
    expect(sleepMinutesBetween(at(1), at(7))).toBe(360);
    expect(sleepMinutesBetween(at(6), at(6))).toBe(24 * 60);
  });
});

describe('validateWake', () => {
  it('accepts a normal night', () => {
    expect(validateWake(at(23), at(6, 30), at(6, 40))).toBeNull();
  });

  it('refuses a wake time in the future, with a small grace', () => {
    expect(validateWake(at(23), at(7), at(6, 50))).toBe('inFuture');
    expect(validateWake(at(23), at(6, 54), at(6, 50))).toBeNull();
    // No future check on a day that is not the real today (dev clock).
    expect(validateWake(at(23), at(7), null)).toBeNull();
  });

  it('refuses nights that are almost surely typos', () => {
    expect(validateWake(at(6), at(6, 30), null)).toBe('tooShort');
    expect(validateWake(at(13), at(6, 30), null)).toBe('tooLong');
    expect(SLEEP.maxMinutes).toBe(960);
  });
});

describe('toWakeMoments', () => {
  it('puts a late bedtime on the night before', () => {
    const { wokeAt, sleptAt } = toWakeMoments('2026-10-14', at(23, 15), at(6, 30));
    expect(sleptAt.getDate()).toBe(13);
    expect(sleptAt.getHours()).toBe(23);
    expect(wokeAt.getDate()).toBe(14);
    expect(sleepMinutesFromMoments(sleptAt.toISOString(), wokeAt.toISOString())).toBe(435);
  });

  it('keeps an after-midnight bedtime on the same day, across a month end', () => {
    const { sleptAt } = toWakeMoments('2026-11-01', at(0, 30), at(7));
    expect(sleptAt.getDate()).toBe(1);
    const late = toWakeMoments('2026-11-01', at(23), at(7));
    expect(late.sleptAt.getMonth()).toBe(9);
    expect(late.sleptAt.getDate()).toBe(31);
  });
});

describe('reading saved moments', () => {
  it('handles missing and broken values', () => {
    expect(sleepMinutesFromMoments(null, '2026-10-14T06:00:00.000Z')).toBeNull();
    expect(sleepMinutesFromMoments('nonsense', '2026-10-14T06:00:00.000Z')).toBeNull();
    expect(sleepMinutesFromMoments('2026-10-14T07:00:00.000Z', '2026-10-14T06:00:00.000Z')).toBeNull();
    expect(clockMinutesOf(null)).toBeNull();
    expect(clockMinutesOf('broken')).toBeNull();
  });
});
