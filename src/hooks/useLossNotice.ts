import { router } from 'expo-router';
import { useEffect } from 'react';

import { db, getActiveArc } from '@/db';
import { findLossToNotify } from '@/features/campaign';
import { useNoticesStore } from '@/stores';

import { useActiveArc } from './useActiveArc';
import { useCampaign } from './useCampaign';
import { useToday } from './useToday';

/**
 * Opens the campaign-lost screen once for each new break. Mounted in the tabs layout,
 * after sealing, so a break found on open is shown straight away.
 *
 * A break is named by the first day of its run of misses, so missing several days in a row
 * is one break, shown once. It is marked as seen the moment the screen opens (not when the
 * screen mounts), so a re-render in between can never open it twice. Only a break later
 * than the last one shown counts: calling a Truce can uncover an older break, already seen.
 *
 * Only a loaded campaign arc can break (free training has nothing to lose), and only on or
 * after its start day. Before opening, the arc is read again from the database: right after
 * "Reset the journey" the live queries can still hold the old arc for a render while the
 * notices are already cleared, and that stale break must never open the screen.
 */
export function useLossNotice(): void {
  const today = useToday();
  const { arc, targets, isLoaded: isArcLoaded } = useActiveArc();
  const campaign = useCampaign(arc, targets, today);
  const acknowledgedLossDay = useNoticesStore((state) => state.acknowledgedLossDay);
  const acknowledgeLoss = useNoticesStore((state) => state.acknowledgeLoss);
  const breakDay = findLossToNotify({
    arc,
    isLoaded: isArcLoaded && campaign.isLoaded,
    records: campaign.records,
    acknowledgedLossDay,
  });
  const arcId = arc?.id ?? null;

  useEffect(() => {
    if (breakDay == null || arcId == null || !isStillActiveArc(arcId)) return;
    acknowledgeLoss(breakDay);
    router.push('/campaign-lost');
  }, [breakDay, arcId, acknowledgeLoss]);
}

/** True when the arc the live queries show is still the active one in the database. */
function isStillActiveArc(arcId: number): boolean {
  try {
    const stored = getActiveArc(db);
    return stored?.id === arcId && stored.kind === 'campaign';
  } catch (error) {
    if (__DEV__) console.warn('[campaign] Could not read the active arc.', error);
    return false;
  }
}
