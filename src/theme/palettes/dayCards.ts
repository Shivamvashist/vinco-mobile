/**
 * The shareable day card's styles, from the prototype. Fixed designs the user picks between,
 * independent of the app's dark or light scheme (a shared card should look the same everywhere).
 * Marble's gold is deeper than the prototype's #8A6819, which fell short of 4.5:1 on marble.
 */
export type DayCardStyle = {
  id: 'basalt' | 'marble' | 'porphyry' | 'aurum' | 'nox';
  name: string;
  /** Styles bought in the Forum show only once owned. Free styles leave this out. */
  isFromForum?: boolean;
  /** A framed card draws this border. */
  frame?: string;
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
  {
    id: 'aurum',
    name: 'Aurum',
    isFromForum: true,
    background: '#D2AC55',
    foreground: '#1D1A17',
    accent: '#3F2D05',
    onAccent: '#D2AC55',
    frame: '#3F2D05',
  },
  {
    id: 'nox',
    name: 'Nox',
    isFromForum: true,
    background: '#0F0E0C',
    foreground: '#ECE5D8',
    accent: '#D2AC55',
    onAccent: '#0F0E0C',
    frame: '#D2AC55',
  },
];
