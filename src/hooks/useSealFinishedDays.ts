import { useEffect } from 'react';

import { db, getActiveArc, sealFinishedDays, selectArcOrders, toOrderTargets } from '@/db';

import { useToday } from './useToday';

/**
 * Seals the arc's finished days when the app opens and whenever the day rolls over,
 * including days the app was closed. Mounted once, in the tabs layout. Safe to repeat.
 */
export function useSealFinishedDays(): void {
  const today = useToday();

  useEffect(() => {
    try {
      const arc = getActiveArc(db);
      if (!arc) return;
      const targets = toOrderTargets(selectArcOrders(db, arc.id).all());
      sealFinishedDays(db, arc, targets, today);
    } catch (error) {
      // Sealing runs again on the next open or midnight; nothing is lost.
      if (__DEV__) console.warn('[campaign] Could not seal finished days.', error);
    }
  }, [today]);
}
