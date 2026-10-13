/**
 * The tabs: one per word of "Veni, vidi, vici", then the camp (settings).
 * Keys match the route file names in src/app/(tabs)/.
 */
export const tabsCopy = {
  veni: {
    latin: 'Veni',
    plain: 'Today',
    meaning: 'I came',
  },
  vidi: {
    latin: 'Vidi',
    plain: 'Progress',
    meaning: 'I saw',
  },
  vici: {
    latin: 'Vici',
    plain: 'Arc',
    meaning: 'I conquered',
  },
  /** A castra was the legion's camp: where it was set up and supplied. */
  settings: {
    latin: 'Castra',
    plain: 'Settings',
    meaning: 'The camp',
  },
} as const;

export type TabName = keyof typeof tabsCopy;

export function isTabName(value: string): value is TabName {
  return Object.prototype.hasOwnProperty.call(tabsCopy, value);
}

/** What a screen reader says for a tab, for example "Veni, Today". */
export function tabAccessibilityLabel(tab: TabName): string {
  return `${tabsCopy[tab].latin}, ${tabsCopy[tab].plain}`;
}
