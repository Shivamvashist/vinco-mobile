import { contrastRatio } from '../contrast';
import { buildEffects, mixColors } from '../effects';
import { PALETTES } from '../palettes/registry';

describe('mixColors', () => {
  it('runs from the first colour to the second, clamped', () => {
    expect(mixColors('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mixColors('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(mixColors('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mixColors('#102030', '#FFFFFF', -1)).toBe('#102030');
    expect(mixColors('#102030', '#FFFFFF', 2)).toBe('#FFFFFF');
  });
});

describe.each(PALETTES.map((palette) => [palette.id, palette] as const))(
  'effects for "%s"',
  (_id, palette) => {
    const effects = buildEffects(palette.colors, palette.scheme);
    const { colors } = palette;

    if (palette.scheme === 'dark') {
      it('glows at full strength with the plain border and no shadow', () => {
        expect(effects).toEqual({ glowStrength: 1, cardBorder: colors.border, cardShadow: undefined });
      });
      return;
    }

    it('glows softer than on dark', () => {
      expect(effects.glowStrength).toBeGreaterThan(0);
      expect(effects.glowStrength).toBeLessThan(1);
    });

    it('draws the card hairline a step stronger than the border, short of borderStrong', () => {
      const plain = contrastRatio(colors.border, colors.surface);
      const card = contrastRatio(effects.cardBorder, colors.surface);
      expect(card).toBeGreaterThan(plain);
      expect(card).toBeLessThan(contrastRatio(colors.borderStrong, colors.surface));
      expect(contrastRatio(effects.cardBorder, colors.background)).toBeGreaterThanOrEqual(1.5);
    });

    it('lifts cards with a soft two-layer shadow in its own ink', () => {
      expect(effects.cardShadow).toMatch(/^0px 1px 2px 0px rgba\(\d+,\d+,\d+,0\.06\), 0px 6px 16px 0px rgba/);
    });
  },
);
