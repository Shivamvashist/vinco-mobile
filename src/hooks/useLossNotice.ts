import { router } from 'expo-router';
import { useEffect } from 'react';

import { findLatestLoss } from '@/features/campaign';
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
 */
export function useLossNotice(): void {
  const today = useToday();
  const { arc, targets } = useActiveArc();
  const campaign = useCampaign(arc, targets, today);
  const acknowledgedLossDay = useNoticesStore((state) => state.acknowledgedLossDay);
  const acknowledgeLoss = useNoticesStore((state) => state.acknowledgeLoss);
  const breakDay = campaign.isLoaded ? (findLatestLoss(campaign.records)?.firstMissedDay ?? null) : null;

  useEffect(() => {
    // Day keys sort as text.
    const isNewBreak = breakDay != null && (acknowledgedLossDay == null || breakDay > acknowledgedLossDay);
    if (!isNewBreak) return;
    acknowledgeLoss(breakDay);
    router.push('/campaign-lost');
  }, [breakDay, acknowledgedLossDay, acknowledgeLoss]);
}
