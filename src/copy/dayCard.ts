import type { DayCardDesignId, DayCardResult } from '@/features/dayCard';
import type { Tone } from '@/features/tone';

/**
 * Memento's one line, by tone and result: at most six words, picked by the day. Never vulgar,
 * never about the person: the phone, the scroll and the excuse lose, the user keeps their word.
 */
const MEMENTO_LINES: Record<Tone, Record<DayCardResult, readonly string[]>> = {
  philosopher: {
    conquered: [
      'You kept your word.',
      'The obstacle became the way.',
      'Nothing owed. All of it paid.',
      'Done well, and done quietly.',
    ],
    held: [
      'Enough, kept faithfully.',
      'Small steps still climb.',
      'The line held. That is all.',
      'Showing up is the work.',
    ],
  },
  centurion: {
    conquered: [
      'Every order. Full marks.',
      'No excuse survived today.',
      'Orders met. Stand tall.',
      'Discipline is remembered.',
    ],
    held: ['Minimum met. Line held.', 'You showed up. Again.', 'Held under fire.', 'Not pretty. Still held.'],
  },
  roast: {
    conquered: [
      'The phone lost today.',
      'Scrolled less. Lived more.',
      'Your excuses are unemployed.',
      'The algorithm misses you.',
    ],
    held: [
      'Barely. But it counts.',
      'The couch lost. Narrowly.',
      'Ugly win. Still a win.',
      'The scroll blinked first.',
    ],
  },
};

/** The shareable day card ("Day sealed"). */
export const dayCardCopy = {
  header: 'Day sealed',
  close: 'Close',
  eyebrow: (dayRoman: string, lengthRoman: string): string => `DAY ${dayRoman} OF ${lengthRoman}`,
  ludusEyebrow: (dayRoman: string): string => `FREE TRAINING · DAY ${dayRoman}`,
  rows: {
    water: 'Water',
    wake: 'Wake-up',
    meal: 'Protein meals',
    workout: 'Workout',
  },
  values: {
    litres: (amount: number): string => `${Number(amount.toFixed(2))} L`,
    meals: (count: number): string => String(count),
    minutes: (minutes: number): string => `${minutes} min`,
    notDone: 'Not yet',
    done: 'Done',
  },
  campaign: (days: number): string => `Campaign ${days}`,
  trained: (days: number): string => `${days} ${days === 1 ? 'day' : 'days'} trained`,
  rank: (name: string): string => `Rank: ${name}`,
  wordmark: 'VINCO',
  styleLabel: (name: string): string => `${name} card style`,
  share: 'Share to story',
  shared: 'Day card ready. Go flex, legally.',
  shareUnavailable: "Sharing isn't available on this phone.",
  shareFailed: "The card couldn't be shared. Try again.",
  seeProgress: 'See your progress',
  /** What a screen reader says for the whole card. */
  cardLabel: (dayRoman: string, lengthRoman: string | null, held: number, total: number): string =>
    `Day card: day ${dayRoman}${lengthRoman ? ` of ${lengthRoman}` : ' of free training'}, ${held} of ${total} orders held`,
  moreStyles: 'More card styles in the Forum',
  pickDesign: 'Design',
  pickColour: 'Colour',
  /** Design names on the picker. Latin ones get their plain meaning in the Forum. */
  designs: {
    classic: 'Classic',
    numeral: 'Numeral',
    laurel: 'Laurel',
    sol: 'Sunrise',
    inscription: 'Tablet',
    stamp: 'Stamp',
    memento: 'Memento',
  } satisfies Record<DayCardDesignId, string>,
  designLabel: (name: string): string => `${name} card design`,
  /** Numeral: "DIES" (day) over the carved numeral, "12 / 60" beside the wordmark. */
  dies: 'DIES',
  dayCount: (day: number, length: number | null): string => (length ? `${day} / ${length}` : String(day)),
  stamp: {
    conquered: { mark: 'VINCO', word: 'VICI.', label: 'I conquered.' },
    held: { mark: 'HELD', word: 'STETI.', label: 'I stood firm.' },
  } satisfies Record<DayCardResult, { mark: string; word: string; label: string }>,
  inscription: {
    motto: 'VENI · VIDI · VICI',
    day: (dayRoman: string): string => `DIES ${dayRoman}`,
    line: { conquered: 'Every order, in full.', held: 'The line held.' } satisfies Record<
      DayCardResult,
      string
    >,
  },
  mementoLines: MEMENTO_LINES,
  /** An own order's value on the card: "30 pages". */
  customValue: (amount: number, unit: string): string => (unit ? `${amount} ${unit}` : String(amount)),
} as const;
