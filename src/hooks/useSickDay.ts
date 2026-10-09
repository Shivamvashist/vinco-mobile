import { callSickDay, cancelSickDay, db, TruceError } from '@/db';
import type { DayKey } from '@/lib/dates';

export type SickDayActions = {
  /** Calls today's sick-day Truce. Returns null when called, or why not. */
  call: () => 'cannotAfford' | 'failed' | null;
  /** Takes it back ("I'm feeling better"). Returns false if that failed. */
  cancel: () => boolean;
};

/** Calling and cancelling a sick-day Truce for today. See docs/DAY-FLOW.md. */
export function useSickDay(today: DayKey): SickDayActions {
  return {
    call: () => {
      try {
        callSickDay(db, today);
        return null;
      } catch (error) {
        if (error instanceof TruceError && error.reason === 'cannot_afford') return 'cannotAfford';
        if (__DEV__) console.warn('[sick day] Could not call the Truce.', error);
        return 'failed';
      }
    },
    cancel: () => {
      try {
        cancelSickDay(db, today);
        return true;
      } catch (error) {
        if (__DEV__) console.warn('[sick day] Could not take the Truce back.', error);
        return false;
      }
    },
  };
}
