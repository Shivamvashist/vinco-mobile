import { router } from 'expo-router';
import { useEffect } from 'react';

import { findLatestLoss } from '@/features/campaign';
import { useNoticesStore } from '@/stores';

import { useActiveArc } from './useActiveArc';
import { useCampaign } from './useCampaign';
import { useToday } from './useToday';

/**
 * Opens the campaign-lost screen once for each new break. Mounted in the tabs layout,
 * after sealing, so a break found on open is shown straight away. Only a break later than
 * the last one shown counts: calling a Truce can uncover an older break, already seen.
 */
export function useLossNotice(): void {
  const today = useToday();
  const { arc, targets } = useActiveArc();
  const campaign = useCampaign(arc, targets, today);
  const acknowledgedLossDay = useNoticesStore((state) => state.acknowledgedLossDay);
  const lossDay = campaign.isLoaded ? (findLatestLoss(campaign.records)?.day ?? null) : null;

  useEffect(() => {
    // Day keys sort as text.
    const isNewLoss = lossDay != null && (acknowledgedLossDay == null || lossDay > acknowledgedLossDay);
    if (isNewLoss) router.push('/campaign-lost');
  }, [lossDay, acknowledgedLossDay]);
}
