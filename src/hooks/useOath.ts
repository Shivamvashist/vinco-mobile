import { OATH_PLAYS_PER_DAY } from '@/features/arc';
import type { DayKey } from '@/lib/dates';
import { oathPlaysOn, useNoticesStore } from '@/stores';

import { useOathPlayer } from './useOathPlayer';

export type Oath = {
  /** False if there is no oath, or its file is gone. */
  isAvailable: boolean;
  isPlaying: boolean;
  /** Plays left today (OATH_PLAYS_PER_DAY a day). */
  playsLeft: number;
  /** Plays (counting one) or stops. Does nothing when today's plays are used up. */
  toggle: () => void;
};

/** The user's oath: heard from Day I, twice a day, so it stays strong when it's needed. */
export function useOath(path: string | null, today: DayKey): Oath {
  const player = useOathPlayer(path);
  const playsToday = useNoticesStore((state) => oathPlaysOn(state, today));
  const recordOathPlay = useNoticesStore((state) => state.recordOathPlay);
  const playsLeft = Math.max(0, OATH_PLAYS_PER_DAY - playsToday);

  return {
    isAvailable: player.isAvailable,
    isPlaying: player.isPlaying,
    playsLeft,
    toggle: () => {
      if (player.isPlaying) {
        player.toggle();
        return;
      }
      if (!player.isAvailable || playsLeft === 0) return;
      recordOathPlay(today);
      player.toggle();
    },
  };
}
