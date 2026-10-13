import { db, startNextArc } from '@/db';
import { type ArcLength, LUDUS_LENGTH_DAYS } from '@/features/arc';

import { useToday } from './useToday';

export type ArcChoice = {
  /** Starts a campaign of this length today. Returns false if it could not be saved. */
  beginCampaign: (length: ArcLength) => boolean;
  /** Ends the current arc and trains in the Ludus from today. Returns false on failure. */
  trainInLudus: () => boolean;
};

/**
 * Moving between campaigns and the Ludus. Both start today and carry the user's setup over
 * (startNextArc), in one transaction: a failure changes nothing.
 */
export function useArcChoice(): ArcChoice {
  const today = useToday();
  const run = (action: () => void): boolean => {
    try {
      action();
      return true;
    } catch (error) {
      if (__DEV__) console.warn('[arc] Could not start the next arc.', error);
      return false;
    }
  };
  return {
    beginCampaign: (length) =>
      run(() => startNextArc(db, { kind: 'campaign', lengthDays: length, startDay: today })),
    trainInLudus: () =>
      run(() => startNextArc(db, { kind: 'ludus', lengthDays: LUDUS_LENGTH_DAYS, startDay: today })),
  };
}
