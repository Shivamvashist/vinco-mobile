import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { guardCopy, pickTone } from '@/copy';
import { db, saveReelDays } from '@/db';
import {
  getMarkedPackages,
  guardBridge,
  type ReelOverlayColors,
  type ReelOverlayCopy,
  type ReelWatchConfig,
} from '@/features/guard';
import type { Tone } from '@/features/tone';
import { useGuardStore, usePreferencesStore } from '@/stores';
import { type ColorPalette, useTheme } from '@/theme';

/** The badge and card words in the user's tone, with "{count}" and "{budget}" for the phone to fill. */
export function reelOverlayCopy(tone: Tone): ReelOverlayCopy {
  const copy = guardCopy.reels.overlay;
  return {
    badge: copy.badge,
    badgeOne: copy.badgeOne,
    badgeLabel: copy.badgeLabel,
    budgetTitle: copy.budgetTitle,
    budgetBody: pickTone(copy.budgetBody, tone),
    milestoneTitle: copy.milestoneTitle,
    milestoneBody: pickTone(copy.milestoneBody, tone),
    close: copy.close,
  };
}

/** The overlay colours from the active palette: marble, then gold near the budget, porphyry past it. */
export function reelOverlayColors(colors: ColorPalette): ReelOverlayColors {
  return {
    surface: colors.surface,
    border: colors.border,
    text: colors.text,
    muted: colors.textMuted,
    near: colors.accent,
    onNear: colors.onAccent,
    over: colors.danger,
  };
}

/**
 * Keeps the native reel counter in step and its counts in the database. Mount once (the root
 * layout). Does nothing where reels can't be counted (Expo Go, older builds).
 *
 * - `configure`: the level, budget, marked apps, and the overlay's words and colours. Sent when
 *   one of them changes; the phone keeps them, so counting goes on with Vinco closed.
 * - Sync: the phone's kept days are copied into `reel_days` when the app opens, when it comes back
 *   to the front, and after every reel counted while it is open.
 */
export function useReelWatch(): void {
  const level = useGuardStore((state) => state.level);
  const reelBudget = useGuardStore((state) => state.reelBudget);
  const tone = usePreferencesStore((state) => state.tone);
  const theme = useTheme();
  const sentRef = useRef<string | null>(null);
  const colorsKey = JSON.stringify(reelOverlayColors(theme.colors));

  useEffect(() => {
    if (!guardBridge.canCountReels) return;
    const config: ReelWatchConfig = {
      level,
      reelBudget,
      markedPackages: getMarkedPackages(),
      copy: reelOverlayCopy(tone),
      colors: JSON.parse(colorsKey) as ReelOverlayColors,
    };
    const key = JSON.stringify(config);
    if (sentRef.current === key) return;
    sentRef.current = key;
    guardBridge.configure(config).catch((error: unknown) => {
      // Forget it so the next change (or launch) tries again.
      if (sentRef.current === key) sentRef.current = null;
      if (__DEV__) console.warn('[reels] Could not configure the reel counter.', error);
    });
  }, [level, reelBudget, tone, colorsKey]);

  useEffect(() => {
    if (!guardBridge.canCountReels) return;
    let isMounted = true;
    const sync = () => {
      guardBridge
        .getReelDays()
        .then((days) => {
          if (isMounted) saveReelDays(db, days);
        })
        .catch((error: unknown) => {
          if (__DEV__) console.warn('[reels] Could not copy the reel counts.', error);
        });
    };
    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    const stopListening = guardBridge.onReel(sync);
    return () => {
      isMounted = false;
      subscription.remove();
      stopListening();
    };
  }, []);
}
