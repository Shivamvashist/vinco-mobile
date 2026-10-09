import { clampProgress, normaliseSegments, roundToHundredths } from '../progress';

describe('clampProgress', () => {
  it.each([
    [0.5, 0.5],
    [0, 0],
    [1, 1],
    [-0.2, 0],
    [1.7, 1],
    [NaN, 0],
    [Infinity, 1],
    [-Infinity, 0],
  ])('%p becomes %p', (input, expected) => {
    expect(clampProgress(input)).toBe(expected);
  });
});

describe('normaliseSegments', () => {
  it('keeps valid input', () => {
    expect(normaliseSegments(4, 2)).toEqual({ total: 4, filled: 2 });
  });

  it('caps filled at total and floors decimals', () => {
    expect(normaliseSegments(4, 9)).toEqual({ total: 4, filled: 4 });
    expect(normaliseSegments(4.8, 2.9)).toEqual({ total: 4, filled: 2 });
  });

  it('handles zero, negative and non-finite input', () => {
    expect(normaliseSegments(0, 3)).toEqual({ total: 0, filled: 0 });
    expect(normaliseSegments(-2, -1)).toEqual({ total: 0, filled: 0 });
    expect(normaliseSegments(NaN, NaN)).toEqual({ total: 0, filled: 0 });
    expect(normaliseSegments(Infinity, 2)).toEqual({ total: 0, filled: 0 });
  });
});

describe('roundToHundredths', () => {
  it('removes floating-point noise', () => {
    expect(roundToHundredths(0.1 + 0.2)).toBe(0.3);
    expect(roundToHundredths(2.5 + 0.5)).toBe(3);
  });
});
