import { contrastRatio, parseColor } from '../contrast';

describe('parseColor', () => {
  it('parses 6-digit and 3-digit hex', () => {
    expect(parseColor('#1D1A17')).toEqual({ r: 29, g: 26, b: 23 });
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('blends translucent rgba over a background', () => {
    expect(parseColor('rgba(255,255,255,0.5)', '#000000')).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('treats opaque rgba without a background as solid', () => {
    expect(parseColor('rgba(10, 20, 30, 1)')).toEqual({ r: 10, g: 20, b: 30 });
  });

  it('rejects translucent colours with no background to blend over', () => {
    expect(() => parseColor('rgba(0,0,0,0.5)')).toThrow(/translucent/);
  });

  it('rejects unsupported formats', () => {
    expect(() => parseColor('red')).toThrow(/Unsupported/);
    expect(() => parseColor('#12345')).toThrow(/Unsupported/);
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black on white and 1 for identical colours', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#D2AC55', '#1D1A17')).toBeCloseTo(contrastRatio('#1D1A17', '#D2AC55'), 5);
  });
});
