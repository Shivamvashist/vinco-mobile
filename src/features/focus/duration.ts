/**
 * Focus lengths and clocks: the ruler's position, a typed custom length, and the h:mm readouts.
 * Pure: no React, no clock.
 */
import { clampFocusMinutes, FOCUS_RULES, snapRulerMinutes } from './focus';

/** The ruler's tick for a length: 0 for 5 minutes, 35 for 180. */
export function rulerIndex(minutes: number): number {
  return (snapRulerMinutes(minutes) - FOCUS_RULES.minMinutes) / FOCUS_RULES.stepMinutes;
}

/**
 * The length under the ruler's centre for a scroll offset, with ticks `tickWidth` apart. Always a
 * valid ruler value, so the readout and the ruler can never disagree (during a drag, a fling, the
 * snap, or an offset past either end).
 */
export function minutesAtOffset(offset: number, tickWidth: number): number {
  if (!Number.isFinite(offset) || !Number.isFinite(tickWidth) || tickWidth <= 0) {
    return FOCUS_RULES.defaultMinutes;
  }
  const index = Math.round(offset / tickWidth);
  return snapRulerMinutes(FOCUS_RULES.minMinutes + index * FOCUS_RULES.stepMinutes);
}

/** A length as "h:mm": 25 reads "0:25", 90 reads "1:30". */
export function formatHoursMinutes(minutes: number): string {
  const safe = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/**
 * A typed custom length (hours and minutes as typed), or null when it isn't a whole number of
 * minutes from 5 to 180. Blank hours or minutes count as 0.
 */
export function parseCustomMinutes(hoursText: string, minutesText: string): number | null {
  const hours = readWhole(hoursText);
  const minutes = readWhole(minutesText);
  if (hours == null || minutes == null) return null;
  const total = hours * 60 + minutes;
  return total >= FOCUS_RULES.minMinutes && total <= FOCUS_RULES.maxMinutes ? total : null;
}

/** Hours and minutes to prefill the custom sheet with. */
export function splitHoursMinutes(minutes: number): { hours: number; minutes: number } {
  const safe = clampFocusMinutes(minutes);
  return { hours: Math.floor(safe / 60), minutes: safe % 60 };
}

/**
 * Time left on a running focus, as the active screen shows it: a large "h:mm" with the seconds
 * beside it. Whole seconds count up, so "0:00" and "00" show only at the very end.
 */
export function splitFocusClock(ms: number): { hoursMinutes: string; seconds: string } {
  const totalSeconds = Math.max(0, Math.ceil((Number.isFinite(ms) ? ms : 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return {
    hoursMinutes: `${hours}:${String(minutes).padStart(2, '0')}`,
    seconds: String(totalSeconds % 60).padStart(2, '0'),
  };
}

/** Whole, non-negative digits only ("" is 0); anything else is null. */
function readWhole(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  return Number(trimmed);
}
