import { addDays, dayOfArc, type DayKey } from '@/lib/dates';

/** The three campaign lengths on offer. */
export const ARC_LENGTHS = [30, 60, 90] as const;

export type ArcLength = (typeof ARC_LENGTHS)[number];

/** The oath opens on Day X: the day most people quit. */
export const OATH_PLAYBACK_DAY = 10;

/**
 * Roman milestones along an arc's journey line: Day I, then every ten days, then the last day.
 * A 60-day arc gives 1, 10, 20, 30, 40, 50, 60.
 */
export function getArcMilestones(lengthDays: number): number[] {
  const length = Math.max(1, Math.floor(lengthDays));
  const tens = Array.from({ length: Math.floor(length / 10) }, (_, index) => (index + 1) * 10);
  return [...new Set([1, ...tens, length])];
}

/** Selfies needed before the first timelapse can be made (Day XXX). */
export const TIMELAPSE_SELFIES = 30;

/** The winter arc: the one most people choose. */
export const DEFAULT_ARC_LENGTH: ArcLength = 60;

export function isArcLength(value: unknown): value is ArcLength {
  return typeof value === 'number' && (ARC_LENGTHS as readonly number[]).includes(value);
}

/** The last day of an arc: a 60-day arc starting 6 October ends 4 December. */
export function arcEndDay(startDay: DayKey, lengthDays: number): DayKey {
  return addDays(startDay, Math.max(1, Math.floor(lengthDays)) - 1);
}

export type ArcPosition =
  /** Today is inside the arc: day 1 to lengthDays. */
  | { phase: 'active'; dayNumber: number; lengthDays: number }
  /** Today is past the last day. */
  | { phase: 'finished'; lengthDays: number }
  /** The arc starts later (only if the clock moved backwards). */
  | { phase: 'notStarted'; lengthDays: number };

/** Where today falls in an arc. */
export function getArcPosition(startDay: DayKey, lengthDays: number, today: DayKey): ArcPosition {
  const dayNumber = dayOfArc(startDay, today);
  if (dayNumber < 1) return { phase: 'notStarted', lengthDays };
  if (dayNumber > lengthDays) return { phase: 'finished', lengthDays };
  return { phase: 'active', dayNumber, lengthDays };
}
