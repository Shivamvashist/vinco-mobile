import type { DayKey } from '@/lib/dates';

/**
 * "Are you up?": the window in which an unlock with no wake-up logged posts the prompt.
 * Minutes from local midnight, `from` included, `until` excluded (03:00 to 12:00).
 * See docs/GUARDIANS.md "Are you up? (wake prompt)".
 */
export const WAKE_PROMPT = { fromMinutes: 3 * 60, untilMinutes: 12 * 60 } as const;

export type WakeWindow = { fromMinutes: number; untilMinutes: number };

/** The prompt's words, in the user's tone (src/copy/notifications.ts `wakePrompt`). */
export type WakeWatchCopy = { title: string; body: string; channelName: string };

/** What the app sends to the native watch. `awakeDay` is the day wake-up was last logged, or null. */
export type WakeWatchConfig = { enabled: boolean; awakeDay: DayKey | null; copy: WakeWatchCopy };

/** True when a time of day (minutes from local midnight) falls in the window. */
export function isInWakeWindow(minutes: number, window: WakeWindow = WAKE_PROMPT): boolean {
  return minutes >= window.fromMinutes && minutes < window.untilMinutes;
}

/**
 * The native rule (modules/vigil VigilWake.onUnlock), written once here so it is tested: on unlock,
 * prompt only when the watch is on, the time is in the window, wake-up isn't logged today and no
 * prompt was posted today. (The native side also needs notifications allowed.)
 */
export function shouldPromptWake(input: {
  enabled: boolean;
  minutes: number;
  today: DayKey;
  awakeDay: DayKey | null;
  promptedDay: DayKey | null;
  window?: WakeWindow;
}): boolean {
  if (!input.enabled) return false;
  if (!isInWakeWindow(input.minutes, input.window)) return false;
  return input.awakeDay !== input.today && input.promptedDay !== input.today;
}

/**
 * What the app should tell the native watch. On only with an arc that has the wake-up order and
 * reminders switched on. A sick-day Truce counts as up: the dawn card is set aside, so is the prompt.
 */
export function planWakeWatch(input: {
  hasArc: boolean;
  arcHasWake: boolean;
  remindersOn: boolean;
  today: DayKey;
  isWakeLogged: boolean;
  isSickDay: boolean;
}): { enabled: boolean; awakeDay: DayKey | null } {
  const enabled = input.hasArc && input.arcHasWake && input.remindersOn;
  const awakeDay = input.isWakeLogged || input.isSickDay ? input.today : null;
  return { enabled, awakeDay };
}
