/** Calories for one day: whole kcal. Above the top, the entry is a typo. */
export const CALORIES_RANGE = { min: 0, max: 10000 } as const;

/** Quick additions on the calories sheet, in kcal. */
export const CALORIE_STEPS = [100, 250, 500] as const;

/**
 * Reads typed calories: digits only ("1850"), spaces and commas ignored ("1,850").
 * Returns whole kcal, or null for empty, malformed or impossible values.
 */
export function parseCalories(text: string): number | null {
  const digits = text.replace(/[\s,]/g, '');
  if (!/^\d{1,5}$/.test(digits)) return null;
  const value = Number(digits);
  return value >= CALORIES_RANGE.min && value <= CALORIES_RANGE.max ? value : null;
}

/** Adds a quick step to what is typed so far, never past the top. */
export function addCalories(text: string, step: number): number {
  const current = parseCalories(text) ?? 0;
  return Math.min(CALORIES_RANGE.max, current + step);
}
