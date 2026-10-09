import { parseWeightKg } from '..';

describe('parseWeightKg', () => {
  it.each([
    ['72', 72],
    ['72.5', 72.5],
    ['72,5', 72.5],
    [' 68.25 ', 68.3],
    ['30', 30],
    ['250', 250],
  ])('%p reads %p kg', (text, expected) => {
    expect(parseWeightKg(text)).toBe(expected);
  });

  it.each(['', 'abc', '72kg', '-70', '7.2.5', '29.9', '251', '1000', '72.555'])('rejects %p', (text) => {
    expect(parseWeightKg(text)).toBeNull();
  });
});
