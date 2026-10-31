import type { ForumItemId, Holding } from '@/features/forum';
import { MAX_ROMAN, toRoman } from '@/lib/toRoman';

/**
 * Day card designs: the layout of the shareable card, picked separately from its colour style.
 * "classic" is the original card with the order rows; the others carry one strong mark and very
 * little text. See docs/DESIGN-SYSTEM.md, "Day card designs".
 */
export const DAY_CARD_DESIGN_IDS = [
  'classic',
  'numeral',
  'laurel',
  'sol',
  'inscription',
  'stamp',
  'memento',
] as const;

export type DayCardDesignId = (typeof DAY_CARD_DESIGN_IDS)[number];

export const DEFAULT_DAY_CARD_DESIGN: DayCardDesignId = 'classic';

/** The day the card shows: every order at its full goal, or the line held at the minimum. */
export type DayCardResult = 'held' | 'conquered';

export function isDayCardDesignId(value: unknown): value is DayCardDesignId {
  return typeof value === 'string' && (DAY_CARD_DESIGN_IDS as readonly string[]).includes(value);
}

/** Designs bought in the Forum, by the item that unlocks them. The rest are free. */
export const DESIGN_FORUM_ITEMS: Partial<Record<DayCardDesignId, ForumItemId>> = {
  stamp: 'designStamp',
  memento: 'designMemento',
};

/** Colour styles bought in the Forum, by style id. */
export const STYLE_FORUM_ITEMS: Partial<Record<string, ForumItemId>> = {
  aurum: 'cardAurum',
  nox: 'cardNox',
};

type Holdings = Partial<Record<ForumItemId, Holding>>;

/** Free (no item), or the item is held. */
function isUnlocked(itemId: ForumItemId | undefined, holdings: Holdings): boolean {
  return itemId == null || (holdings[itemId]?.held ?? 0) > 0;
}

/** The designs the user can pick: the free ones, plus the ones bought in the Forum. */
export function availableDesigns(holdings: Holdings): DayCardDesignId[] {
  return DAY_CARD_DESIGN_IDS.filter((id) => isUnlocked(DESIGN_FORUM_ITEMS[id], holdings));
}

/** The colour styles the user can pick: the free ones, plus the ones bought in the Forum. */
export function availableStyles<T extends { id: string; isFromForum?: boolean }>(
  styles: readonly T[],
  holdings: Holdings,
): T[] {
  return styles.filter((style) => {
    if (!style.isFromForum) return true;
    // A Forum style with no item to buy it by is never shown.
    const itemId = STYLE_FORUM_ITEMS[style.id];
    return itemId != null && isUnlocked(itemId, holdings);
  });
}

/** The saved choice when it is still available, otherwise the first option (or the fallback). */
export function pickAvailable<T>(wanted: T, options: readonly T[], fallback: T): T {
  return options.includes(wanted) ? wanted : (options[0] ?? fallback);
}

/** Today's status as a card result: a day still open shows as held (the quieter card). */
export function toCardResult(status: 'open' | 'held' | 'conquered'): DayCardResult {
  return status === 'conquered' ? 'conquered' : 'held';
}

/** One of a set, chosen by the day so the line changes day to day but stays put within one. */
export function pickByDay<T>(options: readonly T[], dayNumber: number): T | undefined {
  if (options.length === 0) return undefined;
  const day = Number.isFinite(dayNumber) ? Math.max(1, Math.floor(dayNumber)) : 1;
  return options[(day - 1) % options.length];
}

/** Roughly how wide each numeral is in the display face, in ems. Errs wide so text never clips. */
const NUMERAL_WIDTHS: Record<string, number> = {
  I: 0.36,
  V: 0.74,
  X: 0.72,
  L: 0.62,
  C: 0.74,
  D: 0.8,
  M: 0.95,
};
const ONE_LINE_MAX = 168;
const TWO_LINE_MAX = 132;

/** How wide a numeral is at 1px, with its letter spacing (in ems). */
export function numeralWidth(text: string, letterSpacingEm = 0): number {
  return [...text].reduce((width, letter) => width + (NUMERAL_WIDTHS[letter] ?? 0.8) + letterSpacingEm, 0);
}

export type NumeralLayout = { lines: string[]; fontSize: number };

/**
 * The day as a carved Roman numeral that fills the width: one line ("XII"), or split into tens and
 * units ("XXX" over "VIII") when two lines can be set larger.
 */
export function layoutNumeral(dayNumber: number, width: number, letterSpacingEm = 0): NumeralLayout {
  const day = Number.isFinite(dayNumber) ? Math.min(MAX_ROMAN, Math.max(1, Math.floor(dayNumber))) : 1;
  const sizeFor = (lines: string[], max: number) =>
    Math.floor(Math.min(max, ...lines.map((line) => width / numeralWidth(line, letterSpacingEm))));
  const single = [toRoman(day)];
  const units = day % 10;
  if (units === 0 || day < 10) return { lines: single, fontSize: sizeFor(single, ONE_LINE_MAX) };
  const split = [toRoman(day - units), toRoman(units)];
  const singleSize = sizeFor(single, ONE_LINE_MAX);
  const splitSize = sizeFor(split, TWO_LINE_MAX);
  return splitSize > singleSize
    ? { lines: split, fontSize: splitSize }
    : { lines: single, fontSize: singleSize };
}
