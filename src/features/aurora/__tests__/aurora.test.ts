import { DEFAULT_AURORA_SETTINGS, getNextRing, sanitizeAuroraSettings } from '../aurora';

// Wednesday 14 October 2026.
const at = (hours: number, minutes = 0, day = 14) => new Date(2026, 9, day, hours, minutes);

describe('getNextRing', () => {
  const on = { ...DEFAULT_AURORA_SETTINGS, isOn: true, minutes: 6 * 60 + 30 };

  it('rings later today when the time is still ahead', () => {
    expect(getNextRing(on, at(5))).toEqual(at(6, 30));
  });

  it('moves to tomorrow once the time has passed', () => {
    expect(getNextRing(on, at(7))).toEqual(at(6, 30, 15));
  });

  it('skips days not chosen', () => {
    // Weekdays only (Monday 0 to Friday 4): from Friday evening, next is Monday the 19th.
    const weekdays = { ...on, days: [0, 1, 2, 3, 4] as const };
    expect(getNextRing(weekdays, at(20, 0, 16))).toEqual(at(6, 30, 19));
  });

  it('never rings when off or with no days', () => {
    expect(getNextRing({ ...on, isOn: false }, at(5))).toBeNull();
    expect(getNextRing({ ...on, days: [] }, at(5))).toBeNull();
  });
});

describe('sanitizeAuroraSettings', () => {
  it('repairs bad saved values', () => {
    expect(
      sanitizeAuroraSettings({ isOn: 'yes', minutes: 2000, days: [6, 6, 9, 1], mission: 'dance' }),
    ).toEqual({
      isOn: false,
      minutes: DEFAULT_AURORA_SETTINGS.minutes,
      days: [1, 6],
      mission: 'march',
    });
    expect(sanitizeAuroraSettings(null)).toEqual({
      ...DEFAULT_AURORA_SETTINGS,
      days: [...DEFAULT_AURORA_SETTINGS.days],
    });
  });
});
