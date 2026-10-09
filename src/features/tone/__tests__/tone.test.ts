import { DEFAULT_TONE, isTone, TONES } from '../tone';

describe('isTone', () => {
  it('accepts every known tone', () => {
    for (const tone of TONES) expect(isTone(tone)).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isTone('Roast me')).toBe(false);
    expect(isTone('')).toBe(false);
    expect(isTone(null)).toBe(false);
    expect(isTone(undefined)).toBe(false);
    expect(isTone(2)).toBe(false);
  });

  it('has a valid default', () => {
    expect(isTone(DEFAULT_TONE)).toBe(true);
  });
});
