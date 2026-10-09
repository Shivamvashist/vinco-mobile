/** Clamps a progress value into 0 to 1. NaN and negative values become 0; Infinity becomes 1. */
export function clampProgress(value: number): number {
  if (Number.isNaN(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/**
 * Normalises a segmented progress: a whole number of segments, with filled in 0 to total.
 * Bad input (NaN, negatives, decimals, filled above total) never breaks the layout.
 */
export function normaliseSegments(total: number, filled: number): { total: number; filled: number } {
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const safeFilled = Number.isNaN(filled) ? 0 : Math.min(safeTotal, Math.max(0, Math.floor(filled)));
  return { total: safeTotal, filled: safeFilled };
}

/** Rounds to 2 decimals so stepping by 0.5 or 0.1 never shows floating-point noise. */
export function roundToHundredths(value: number): number {
  return Math.round(value * 100) / 100;
}
