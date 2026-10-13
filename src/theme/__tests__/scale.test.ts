import { buildTheme } from '../resolveTheme';
import { vincoTheme } from '../themes/vinco';
import { DESIGN_WIDTH, getSizeScale, getTypeScale } from '../tokens/scale';

describe('size scale', () => {
  it('keeps design sizes on wide phones and shrinks on narrow ones, within limits', () => {
    expect(getSizeScale(DESIGN_WIDTH)).toBe(1);
    expect(getSizeScale(600)).toBe(1);
    expect(getSizeScale(360)).toBeCloseTo(360 / DESIGN_WIDTH);
    expect(getSizeScale(200)).toBe(0.84);
    expect(getSizeScale(Number.NaN)).toBe(1);
    expect(getSizeScale(0)).toBe(1);
  });

  it('shrinks type less than spacing', () => {
    expect(getTypeScale(1)).toBe(1);
    expect(getTypeScale(0.84)).toBeGreaterThan(0.84);
  });

  it('builds a smaller theme for a narrow phone, but never smaller touch targets', () => {
    const wide = buildTheme(vincoTheme, 'dark', 1);
    const narrow = buildTheme(vincoTheme, 'dark', getSizeScale(340));
    expect(narrow.space.lg).toBeLessThan(wide.space.lg);
    expect(narrow.layout.buttonHeight).toBeLessThan(wide.layout.buttonHeight);
    expect(narrow.type.body.fontSize).toBeLessThan(wide.type.body.fontSize ?? 0);
    expect(narrow.layout.minTouchTarget).toBe(wide.layout.minTouchTarget);
    expect(narrow.layout.borderWidth).toBe(wide.layout.borderWidth);
  });
});
