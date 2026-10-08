import { buildTheme, resolveSchemeName } from '../resolveTheme';
import { vincoTheme } from '../themes/vinco';

describe('resolveSchemeName', () => {
  it('uses an explicit choice regardless of the phone setting', () => {
    expect(resolveSchemeName('dark', 'light')).toBe('dark');
    expect(resolveSchemeName('light', 'dark')).toBe('light');
  });

  it('follows the phone when set to system', () => {
    expect(resolveSchemeName('system', 'light')).toBe('light');
    expect(resolveSchemeName('system', 'dark')).toBe('dark');
  });

  it('falls back to dark when the phone reports nothing usable', () => {
    expect(resolveSchemeName('system', null)).toBe('dark');
    expect(resolveSchemeName('system', undefined)).toBe('dark');
    expect(resolveSchemeName('system', 'unspecified')).toBe('dark');
  });
});

describe('buildTheme', () => {
  it('returns the requested scheme with the theme fonts in every text style', () => {
    const theme = buildTheme(vincoTheme, 'light');
    expect(theme.scheme).toBe('light');
    expect(theme.colors).toBe(vincoTheme.schemes.light.colors);
    expect(theme.type.title.fontFamily).toBe(vincoTheme.fonts.families.display);
    expect(theme.type.body.fontFamily).toBe(vincoTheme.fonts.families.body);
  });
});
