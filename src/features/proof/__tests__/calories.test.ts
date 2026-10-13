import { addCalories, CALORIES_RANGE, parseCalories } from '..';

describe('calories', () => {
  it('reads whole kcal, with commas and spaces ignored', () => {
    expect(parseCalories('1850')).toBe(1850);
    expect(parseCalories('1,850')).toBe(1850);
    expect(parseCalories(' 1 850 ')).toBe(1850);
    expect(parseCalories('0')).toBe(0);
  });

  it('refuses empty, decimal, negative and impossible values', () => {
    expect(parseCalories('')).toBeNull();
    expect(parseCalories('1850.5')).toBeNull();
    expect(parseCalories('-200')).toBeNull();
    expect(parseCalories('lots')).toBeNull();
    expect(parseCalories(String(CALORIES_RANGE.max + 1))).toBeNull();
  });

  it('adds quick steps to what is typed, never past the top', () => {
    expect(addCalories('', 250)).toBe(250);
    expect(addCalories('1500', 500)).toBe(2000);
    expect(addCalories('9900', 500)).toBe(CALORIES_RANGE.max);
  });
});
