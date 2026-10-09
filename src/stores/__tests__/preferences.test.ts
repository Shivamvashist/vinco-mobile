import {
  clampGhostOpacity,
  DEFAULT_PREFERENCES,
  GHOST_OPACITY_MAX,
  sanitizePreferences,
} from '../preferences';

describe('sanitizePreferences', () => {
  it('keeps every valid field', () => {
    const saved = {
      tone: 'roast',
      themeId: 'vinco',
      colorMode: 'light',
      soundEnabled: false,
      hapticsEnabled: false,
      ghostOpacity: 0.45,
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

describe('ghost opacity', () => {
  it('stays between 0 and the maximum', () => {
    expect(clampGhostOpacity(0.9)).toBe(GHOST_OPACITY_MAX);
    expect(clampGhostOpacity(-1)).toBe(0);
    expect(clampGhostOpacity(0.333)).toBe(0.33);
    expect(clampGhostOpacity(Number.NaN)).toBe(DEFAULT_PREFERENCES.ghostOpacity);
    expect(sanitizePreferences({ ghostOpacity: 5 })).toEqual({ ghostOpacity: GHOST_OPACITY_MAX });
    expect(sanitizePreferences({ ghostOpacity: 'half' })).toEqual({});
  });
});
