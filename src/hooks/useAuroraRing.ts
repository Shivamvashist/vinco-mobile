import { useEffect, useState } from 'react';

import { awardAuroraFirstTry, db, spendAlarmPass } from '@/db';
import { AURORA_FIRST_TRY_DENARII } from '@/features/campaign';
import { auroraBridge, earnsFirstTry } from '@/features/aurora';

import { useActiveArc } from './useActiveArc';
import { useForum } from './useForum';
import { useSickDay } from './useSickDay';
import { useTodayOrders } from './useTodayOrders';

export type SickResult = 'stopped' | 'cannotAfford' | 'failed';

export type AuroraRing = {
  /** Alarm passes held now. */
  passesHeld: number;
  /** Denarii held now (for the "Truce costs" line). */
  balance: number;
  /** Free training has no Truces: "I'm sick" only stops the alarm there. */
  isLudus: boolean;
  /** The mission is done: stops, logs wake-up, pays the first try. Returns the denarii paid. */
  finishMission: () => number;
  /** "I'm sick": calls the sick-day Truce (campaigns), then stops. Keeps ringing if refused. */
  callSick: () => SickResult;
  /** Spends an alarm pass and stops. False (still ringing) if none could be spent. */
  spendPass: () => boolean;
};

function stopRinging(): void {
  auroraBridge.stopRinging().catch((error: unknown) => {
    if (__DEV__) console.warn('[aurora] Could not stop the ringing.', error);
  });
}

/** The ring screen's ways out: the mission, a sick day, or an alarm pass. */
export function useAuroraRing(): AuroraRing {
  const { arc, targets } = useActiveArc();
  const orders = useTodayOrders(targets, arc?.id ?? null);
  const today = orders.today;
  const sickDay = useSickDay(today);
  const forum = useForum();
  const isLudus = arc?.kind === 'ludus';
  // Read once when the screen opens: was it still ringing (not after the 10-minute safety stop)?
  const [wasRinging, setWasRinging] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    auroraBridge
      .isRinging()
      .then((value) => !isCancelled && setWasRinging(value))
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    passesHeld: forum.holdings.venia.held,
    balance: forum.balance,
    isLudus,
    finishMission: () => {
      stopRinging();
      if (!orders.wokeAt) orders.logWakeUp(new Date(), null);
      if (!earnsFirstTry('mission', wasRinging)) return 0;
      try {
        return awardAuroraFirstTry(db, today) ? AURORA_FIRST_TRY_DENARII : 0;
      } catch (error) {
        if (__DEV__) console.warn('[aurora] Could not pay the first try.', error);
        return 0;
      }
    },
    callSick: () => {
      if (!isLudus) {
        const problem = sickDay.call();
        if (problem) return problem;
      }
      stopRinging();
      return 'stopped';
    },
    spendPass: () => {
      try {
        if (!spendAlarmPass(db, today)) return false;
      } catch (error) {
        if (__DEV__) console.warn('[aurora] Could not use the alarm pass.', error);
        return false;
      }
      stopRinging();
      return true;
    },
  };
}
