import { type AudioPlayer, useAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

const RAIN = require('@/assets/sounds/ambient/rain.wav');

/** Soft, under the user's own volume: a bed, not a cue. */
const RAIN_VOLUME = 0.55;
/** Fades in and out over this long, in small steps on a JS timer. */
const FADE_MS = 400;
const FADE_STEP_MS = 40;

/**
 * The focus rain (assets/sounds/ambient/rain.wav, a seamless 24 s loop from
 * scripts/generate-rain.mjs). Plays while `isOn` and `isActive` and the app is in front; fades in
 * and out, and stops at once when the app leaves the foreground or the screen unmounts (the
 * player is released with it). An explicit toggle, so it ignores the app's Sounds setting, but
 * not the phone's silent mode: the app's audio mode (theme/feedback/soundBank) is left as it is.
 */
export function useRainSound(isOn: boolean, isActive: boolean): void {
  const player = useAudioPlayer(RAIN);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldPlay = isOn && isActive && isAppActive;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setIsAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!shouldPlay) return;
    stopFade(fadeTimer);
    attempt(() => {
      player.loop = true;
      player.volume = 0;
      player.play();
    });
    fadeTimer.current = fade(player, 0, RAIN_VOLUME, () => undefined);
    return () => {
      stopFade(fadeTimer);
      // Sent away: stop now (timers may not run in the background). Toggled off: fade out.
      if (AppState.currentState !== 'active') {
        attempt(() => player.pause(), { quiet: true });
        return;
      }
      fadeTimer.current = fade(player, readVolume(player), 0, () => attempt(() => player.pause()));
    };
  }, [shouldPlay, player]);

  // Unmounting (the focus ended, or the screen closed): no fade left running. The player is
  // released by useAudioPlayer, which stops the sound.
  useEffect(() => () => stopFade(fadeTimer), [player]);
}

/** Steps the volume from `from` to `to` over FADE_MS, then calls `onDone`. */
function fade(player: AudioPlayer, from: number, to: number, onDone: () => void) {
  const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP_MS));
  let step = 0;
  const timer = setInterval(() => {
    step += 1;
    const share = Math.min(1, step / steps);
    attempt(() => {
      player.volume = from + (to - from) * share;
    });
    if (share >= 1) {
      clearInterval(timer);
      onDone();
    }
  }, FADE_STEP_MS);
  return timer;
}

function stopFade(timer: { current: ReturnType<typeof setInterval> | null }) {
  if (timer.current != null) clearInterval(timer.current);
  timer.current = null;
}

function readVolume(player: AudioPlayer): number {
  const volume = player.volume;
  return typeof volume === 'number' && Number.isFinite(volume) ? volume : RAIN_VOLUME;
}

/**
 * Sound is a nice-to-have: a released or failed player never breaks the focus. `quiet`: a player
 * already released on unmount is expected, not worth a warning.
 */
function attempt(action: () => void, { quiet = false }: { quiet?: boolean } = {}) {
  try {
    action();
  } catch (error) {
    if (__DEV__ && !quiet) console.warn('[focus] The rain sound failed.', error);
  }
}
