import type { DayCardResult } from '@/features/dayCard';
import type { Tone } from '@/features/tone';
import type { DayCardStyle } from '@/theme';

/** One order on the card: a row on the classic design, a mark (tick, ray, berry) on the others. */
export type DayCardRow = { label: string; value: string; isDone: boolean };

/** What every design draws from: the day, its orders and the arc around it. */
export type DayCardContent = {
  dayNumber: number;
  lengthDays: number;
  rows: readonly DayCardRow[];
  /** The campaign, or in free training the days trained. */
  campaign: number;
  /** Free training has no length: "FREE TRAINING · DAY III" and days trained instead. */
  isLudus?: boolean;
  rankName: string | null;
  /** Conquered (every order in full) or held. Memento and Stamp change with it. */
  result?: DayCardResult;
  /** The voice for Memento's line. */
  tone?: Tone;
};

/** A design's body. The shell (size, colour, frame, capture ref) is drawn around it by DayCard. */
export type DayCardDesignProps = DayCardContent & { cardStyle: DayCardStyle };

/** Every card is captured at this size, so shared images match on every phone. */
export const CARD_WIDTH = 270;
export const CARD_HEIGHT = 480;
