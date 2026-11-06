import {
  clampEveningMinutes,
  DEFAULT_REMINDER_SETTINGS,
  REMINDER_RULES,
  sanitizeReminderSettings,
  toNotificationPath,
} from '..';

describe('sanitizeReminderSettings', () => {
  it('falls back to the defaults for missing or corrupted saves', () => {
    expect(sanitizeReminderSettings(undefined)).toEqual(DEFAULT_REMINDER_SETTINGS);
    expect(sanitizeReminderSettings('broken')).toEqual(DEFAULT_REMINDER_SETTINGS);
    expect(sanitizeReminderSettings([1, 2])).toEqual(DEFAULT_REMINDER_SETTINGS);
  });

  it('keeps valid choices and repairs each bad field on its own', () => {
    const saved = sanitizeReminderSettings({
      isOn: false,
      kinds: { morning: false, evening: 'yes', unknown: true },
      eveningMinutes: 19 * 60,
    });
    expect(saved.isOn).toBe(false);
    expect(saved.kinds).toEqual({ ...DEFAULT_REMINDER_SETTINGS.kinds, morning: false });
    expect(saved.eveningMinutes).toBe(19 * 60);
  });
});

describe('clampEveningMinutes', () => {
  it('keeps the evening time between 4 pm and 10 pm, in whole minutes', () => {
    expect(clampEveningMinutes(60)).toBe(REMINDER_RULES.eveningEarliestMinutes);
    expect(clampEveningMinutes(23 * 60)).toBe(REMINDER_RULES.eveningLatestMinutes);
    expect(clampEveningMinutes(1200.4)).toBe(1200);
    expect(clampEveningMinutes(Number.NaN)).toBe(REMINDER_RULES.defaultEveningMinutes);
    expect(clampEveningMinutes('20:30')).toBe(REMINDER_RULES.defaultEveningMinutes);
  });

  it('never lets the evening reminder meet the last call', () => {
    expect(REMINDER_RULES.eveningLatestMinutes).toBeLessThan(REMINDER_RULES.lastCallMinutes);
    expect(REMINDER_RULES.lastCallMinutes).toBeLessThan(REMINDER_RULES.quietStartMinutes);
  });
});

describe('toNotificationPath', () => {
  it('accepts in-app paths and the vinco:// form', () => {
    expect(toNotificationPath('/veni')).toBe('/veni');
    expect(toNotificationPath('vinco://shop')).toBe('/shop');
    // The Shop was the Forum until 2 Nov: old links still land on it.
    expect(toNotificationPath('vinco://forum')).toBe('/shop');
    expect(toNotificationPath('vinco:///settings/')).toBe('/settings');
    expect(toNotificationPath('/vidi?week=2')).toBe('/vidi');
  });

  it('opens Today for anything missing, unknown or foreign', () => {
    expect(toNotificationPath(undefined)).toBe('/veni');
    expect(toNotificationPath(42)).toBe('/veni');
    expect(toNotificationPath('https://example.com/forum')).toBe('/veni');
    expect(toNotificationPath('/dev/theme-lab')).toBe('/veni');
    expect(toNotificationPath('')).toBe('/veni');
  });
});
