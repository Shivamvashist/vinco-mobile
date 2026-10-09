/**
 * The shareable day card's styles, from the prototype. Fixed designs the user picks between,
 * independent of the app's dark or light scheme (a shared card should look the same everywhere).
 * Marble's gold is deeper than the prototype's #8A6819, which fell short of 4.5:1 on marble.
 */
export type DayCardStyle = {
  id: 'basalt' | 'marble' | 'porphyry';
  name: string;
  background: string;
  foreground: string;
  /** Laurel, ticks and wordmark. */
  accent: string;
  /** Tick marks drawn on the accent. */
  onAccent: string;
};

export const DAY_CARD_STYLES: readonly DayCardStyle[] = [
  {
    id: 'basalt',
    name: 'Basalt',
    background: '#26221E',
    foreground: '#ECE5D8',
    accent: '#D2AC55',
    onAccent: '#26221E',
  },
  {
    id: 'marble',
    name: 'Marble',
    background: '#ECE5D8',
    foreground: '#1D1A17',
    accent: '#7A5C14',
    onAccent: '#ECE5D8',
  },
  {
    id: 'porphyry',
    name: 'Porphyry',
    background: '#6E2434',
    foreground: '#F6E9EC',
    accent: '#E8C98A',
    onAccent: '#6E2434',
  },
];
