import { DEFAULT_PREFERENCES, sanitizePreferences } from '../preferences';

describe('sanitizePreferences', () => {
  it('keeps every valid field', () => {
    const saved = {
      tone: 'roast',
      themeId: 'vinco',
      colorMode: 'light',
      soundEnabled: false,
      hapticsEnabled: false,
    };
    expect(sanitizePreferences(saved)).toEqual(saved);
  });

  it('returns nothing for missing or non-object saves', () => {
    expect(sanitizePreferences(undefined)).toEqual({});
    expect(sanitizePreferences(null)).toEqual({});
    expect(sanitizePreferences('corrupted')).toEqual({});
    expect(sanitizePreferences(42)).toEqual({});
  });

  it('drops invalid fields and keeps the valid ones', () => {
    expect(
      sanitizePreferences({
        tone: 'Roast me',
        themeId: '',
        colorMode: 'sepia',
        soundEnabled: 'yes',
        hapticsEnabled: true,
      }),
    ).toEqual({ hapticsEnabled: true });
  });

  it('drops a theme id that is not registered', () => {
    expect(sanitizePreferences({ themeId: 'retired-theme' })).toEqual({});
  });

  it('ignores unknown extra fields', () => {
    expect(sanitizePreferences({ tone: 'philosopher', removedField: 1 })).toEqual({ tone: 'philosopher' });
  });

  it('has defaults that pass their own validation', () => {
    expect(sanitizePreferences(DEFAULT_PREFERENCES)).toEqual(DEFAULT_PREFERENCES);
  });
});
