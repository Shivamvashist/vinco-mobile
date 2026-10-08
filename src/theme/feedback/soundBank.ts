import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import type { FeedbackCue, FeedbackSet } from '../types';

export type SoundBank = {
  play: (cue: FeedbackCue) => void;
  release: () => void;
};

/**
 * UI sounds mix with the user's music and stay quiet when the phone is on silent.
 * Call once at start-up. Never throws: sound is a nice-to-have, not the core job.
 */
export async function configureUiAudio(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
    });
  } catch (error) {
    if (__DEV__) console.warn('[feedback] Could not set audio mode.', error);
  }
}

/**
 * Preloads one player per cue so taps play without delay.
 * A cue that fails to load is skipped, never fatal.
 */
export function createSoundBank(feedback: FeedbackSet): SoundBank {
  const players = new Map<FeedbackCue, AudioPlayer>();
  const volume = Math.min(1, Math.max(0, feedback.volume));

  for (const [cue, source] of Object.entries(feedback.sounds) as [
    FeedbackCue,
    FeedbackSet['sounds'][FeedbackCue],
  ][]) {
    if (source == null) continue;
    try {
      const player = createAudioPlayer(source);
      player.volume = volume;
      players.set(cue, player);
    } catch (error) {
      if (__DEV__) console.warn(`[feedback] Could not load sound "${cue}".`, error);
    }
  }

  return {
    play(cue) {
      const player = players.get(cue);
      if (!player) return;
      try {
        // Rewind so rapid taps replay from the start instead of being ignored.
        void player.seekTo(0).catch(() => undefined);
        player.play();
      } catch (error) {
        if (__DEV__) console.warn(`[feedback] Could not play "${cue}".`, error);
      }
    },
    release() {
      for (const player of players.values()) {
        try {
          player.release();
        } catch {
          // Already released; nothing to do.
        }
      }
      players.clear();
    },
  };
}
