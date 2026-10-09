import { MAX_ROMAN, toRoman } from '../toRoman';

describe('toRoman', () => {
  it.each([
    [1, 'I'],
    [4, 'IV'],
    [9, 'IX'],
    [12, 'XII'],
    [30, 'XXX'],
    [40, 'XL'],
    [60, 'LX'],
    [90, 'XC'],
    [400, 'CD'],
    [2026, 'MMXXVI'],
    [MAX_ROMAN, 'MMMCMXCIX'],
  ])('%d is %s', (value, expected) => {
    expect(toRoman(value)).toBe(expected);
  });

  it.each([0, -1, 1.5, NaN, Infinity, MAX_ROMAN + 1])('rejects %p', (value) => {
    expect(() => toRoman(value)).toThrow(RangeError);
  });
});
