const NUMERALS: readonly [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export const MAX_ROMAN = 3999;

/**
 * Converts 1 to 3999 into Roman numerals (12 becomes "XII").
 * Decoration only: always show the Arabic number nearby.
 * @throws RangeError for zero, negatives, decimals, NaN and anything above 3999.
 */
export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > MAX_ROMAN) {
    throw new RangeError(`toRoman needs a whole number from 1 to ${MAX_ROMAN}, got ${value}.`);
  }
  let remaining = value;
  let result = '';
  for (const [amount, numeral] of NUMERALS) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}
