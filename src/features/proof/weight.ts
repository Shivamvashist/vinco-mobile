/** Sensible limits for an adult's body weight, in kg. Outside them, the entry is a typo. */
export const WEIGHT_RANGE_KG = { min: 30, max: 250 } as const;

/**
 * Reads a typed weight: "72", "72.5" or "72,5" (comma decimals are common on Indian keyboards).
 * Returns kg rounded to one decimal, or null for empty, malformed or impossible values.
 */
export function parseWeightKg(text: string): number | null {
  const normalised = text.trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalised)) return null;
  const value = Math.round(Number(normalised) * 10) / 10;
  if (value < WEIGHT_RANGE_KG.min || value > WEIGHT_RANGE_KG.max) return null;
  return value;
}
