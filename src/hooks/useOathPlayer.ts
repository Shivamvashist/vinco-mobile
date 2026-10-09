import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { File } from 'expo-file-system';
import { useEffect } from 'react';

import { restoreUiAudioMode } from '@/theme';

export type OathPlayer = {
  /** False if there is no oath, or its file is gone. */
  isAvailable: boolean;
  isPlaying: boolean;
  toggle: () => void;
};

/**
 * Plays the oath recording. The user asked to hear it, so it plays even on silent;
 * the UI audio mode comes back as soon as it stops or finishes.
 */
export function useOathPlayer(path: string | null): OathPlayer {
  const isAvailable = path != null && fileExists(path);
  const player = useAudioPlayer(isAvailable ? { uri: path } : null);
  const status = useAudioPlayerStatus(player);

  // Back to UI audio when playback ends on its own.
  useEffect(() => {
    if (status.didJustFinish) {
      void player.seekTo(0).catch(() => undefined);
      void restoreUiAudioMode();
    }
  }, [status.didJustFinish, player]);

  const toggle = () => {
    if (!isAvailable) return;
    if (status.playing) {
      player.pause();
      void restoreUiAudioMode();
      return;
    }
    void setAudioModeAsync({ playsInSilentMode: true })
      .catch(() => undefined)
      .then(() => player.play());
  };

  return { isAvailable, isPlaying: status.playing, toggle };
}

function fileExists(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}
