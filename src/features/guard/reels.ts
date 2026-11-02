import type { DayKey } from '@/lib/dates';

import { getReelMilestone, type GuardLevel, levelIncludes } from './guard';

/** An app whose reels or shorts the Vigil counts. */
export type ReelApp = { packageName: string; label: string };

/**
 * The apps counted by default (docs/GUARDIANS.md "The reel counter"). The native rule table
 * (modules/vigil VigilReelRules.kt) knows how to find the reels screen in each; any other package
 * passed to `configure` gets the generic full-screen pager rule.
 */
export const REEL_APPS: readonly ReelApp[] = [
  { packageName: 'com.instagram.android', label: 'Instagram' },
  { packageName: 'com.google.android.youtube', label: 'YouTube' },
  // YouTube's common rebuilds (ReVanced): same Shorts layout, other package names.
  { packageName: 'app.revanced.android.youtube', label: 'YouTube' },
  { packageName: 'app.rvx.android.youtube', label: 'YouTube' },
  { packageName: 'com.zhiliaoapp.musically', label: 'TikTok' },
  { packageName: 'com.ss.android.ugc.trill', label: 'TikTok' },
  { packageName: 'com.facebook.katana', label: 'Facebook' },
  { packageName: 'com.snapchat.android', label: 'Snapchat' },
];

/** The default apps plus any the user marked: trimmed, without blanks or repeats. */
export function getMarkedPackages(extra: readonly string[] = []): string[] {
  const all = [...REEL_APPS.map((app) => app.packageName), ...extra.map((name) => name.trim())];
  return [...new Set(all.filter((name) => name.length > 0))];
}

/** The app names to show, one per label (TikTok's two packages read as one). */
export function getReelAppLabels(): string[] {
  return [...new Set(REEL_APPS.map((app) => app.label))];
}

/**
 * When the Vigil steps in with a card: the allowance just reached, a round milestone under it, or
 * the blocking card on every reel past it (it supersedes the milestones there).
 */
export type ReelStepIn = 'budget' | 'milestone' | 'block';

/**
 * The step-in at this count, or null. Vigil level and up; Pax never interrupts. `allowance` is the
 * budget plus today's reel passes. The allowance wins when it and a milestone fall on the same
 * reel. Mirrors VigilReelPolicy.stepIn (Kotlin).
 */
export function getReelStepIn(count: number, allowance: number, level: GuardLevel): ReelStepIn | null {
  if (!levelIncludes(level, 'vigil') || !Number.isInteger(count) || count <= 0) return null;
  if (count > allowance) return 'block';
  if (count === allowance) return 'budget';
  return getReelMilestone(count) == null ? null : 'milestone';
}

/** The badge's colour: calm (marble), near the budget (gold, from 80%), over (porphyry, past it). */
export type ReelBadgeStage = 'calm' | 'near' | 'over';

/** Against the allowance (the budget plus today's passes). Mirrors VigilReelPolicy.stage (Kotlin). */
export function getReelBadgeStage(count: number, allowance: number): ReelBadgeStage {
  if (count > allowance) return 'over';
  if (count * 5 >= allowance * 4) return 'near';
  return 'calm';
}

/** One day's reel count, as the phone keeps it. */
export type ReelDay = { day: DayKey; count: number };

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** A native count as a whole number of reels, or null when it isn't one. */
export function toReelCount(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

/** Keeps only well-formed days (yyyy-MM-dd, a count of 0 or more), one per day, oldest first. */
export function sanitizeReelDays(raw: unknown): ReelDay[] {
  if (!Array.isArray(raw)) return [];
  const byDay = new Map<DayKey, number>();
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const { day, count } = item as { day?: unknown; count?: unknown };
    const value = toReelCount(count);
    if (typeof day !== 'string' || !DAY_KEY.test(day) || value == null) continue;
    byDay.set(day, value);
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, count]) => ({ day, count }));
}
