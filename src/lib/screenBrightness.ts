import type * as ExpoBrightness from 'expo-brightness';
import { Platform } from 'react-native';

type BrightnessModule = typeof ExpoBrightness;

/** Loaded on first use: a development build made before expo-brightness was added lacks it. */
let brightness: BrightnessModule | null | undefined;
/** The window's brightness before dimming, restored afterwards (iOS; Android hands back to the system). */
let saved: number | null = null;
/**
 * Every change runs after the one before it finishes, so a restore asked for while a dim is still
 * reading the brightness (the focus ending just after the full-screen rain dimmed) lands last.
 */
let queue: Promise<void> = Promise.resolve();

function inTurn(task: () => Promise<void>): Promise<void> {
  queue = queue.then(task, task);
  return queue;
}

function load(): BrightnessModule | null {
  if (brightness === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      brightness = require('expo-brightness') as BrightnessModule;
    } catch (error) {
      if (__DEV__) console.warn('[brightness] Not available in this build.', error);
      brightness = null;
    }
  }
  return brightness;
}

/**
 * Dims this app's window (never the phone's own setting, so no permission is needed and leaving
 * the app always shows the phone's normal brightness). Fails quietly: dimming is a nicety.
 */
export function dimScreen(level: number): Promise<void> {
  return inTurn(async () => {
    const module = load();
    if (!module) return;
    try {
      if (saved == null && Platform.OS !== 'android') saved = await module.getBrightnessAsync();
      await module.setBrightnessAsync(Math.min(1, Math.max(0, level)));
    } catch (error) {
      if (__DEV__) console.warn('[brightness] Could not dim the screen.', error);
    }
  });
}

/** Gives the window its normal brightness back. Safe to call when it was never dimmed. */
export function restoreScreenBrightness(): Promise<void> {
  return inTurn(async () => {
    const module = load();
    if (!module) return;
    try {
      if (Platform.OS === 'android') {
        await module.restoreSystemBrightnessAsync();
      } else if (saved != null) {
        await module.setBrightnessAsync(saved);
      }
      saved = null;
    } catch (error) {
      if (__DEV__) console.warn('[brightness] Could not restore the brightness.', error);
    }
  });
}
