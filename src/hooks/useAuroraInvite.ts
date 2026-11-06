import { auroraBridge, shouldInviteAurora } from '@/features/aurora';
import { useAuroraInviteStore, useGuardStore } from '@/stores';

export type AuroraInvite = {
  /** True while Today should invite the user to set up Aurora. */
  isShown: boolean;
  /** "Not now": closes the invite for good. */
  dismiss: () => void;
};

/**
 * Today's invite to set up Aurora: shown only in the Vinco build (Expo Go can't ring), while
 * Aurora is off, until it is dismissed or Aurora has been turned on once.
 */
export function useAuroraInvite(): AuroraInvite {
  const isOn = useGuardStore((state) => state.aurora.isOn);
  const isClosed = useAuroraInviteStore((state) => state.isClosed);
  const dismiss = useAuroraInviteStore((state) => state.close);
  return {
    isShown: shouldInviteAurora({ isSupported: auroraBridge.isSupported, isOn, isClosed }),
    dismiss,
  };
}
