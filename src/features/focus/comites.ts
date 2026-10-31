/**
 * The Comites ("your three companions"): up to three apps the user keeps during every guard,
 * besides the Phone app, which is always allowed. Saved on the phone (guard store). Pure.
 */
import { FOCUS_RULES } from './focus';

/** One kept app. `icon` is a small PNG data URI from the phone, or null. */
export type FocusComes = { packageName: string; label: string; icon: string | null };

/** An Android package name: two or more dot-separated parts, each starting with a letter. */
const PACKAGE_PATTERN = /^[A-Za-z][\w]*(\.[A-Za-z][\w]*)+$/;
const MAX_LABEL_LENGTH = 60;
/** A 96 px PNG is a few kilobytes; anything far larger is not one of ours. */
const MAX_ICON_LENGTH = 200_000;

export function isPackageName(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 255 && PACKAGE_PATTERN.test(value);
}

/** Keeps only valid, distinct apps, at most three. A broken save gives an empty list, never a crash. */
export function sanitizeComites(saved: unknown): FocusComes[] {
  if (!Array.isArray(saved)) return [];
  const kept: FocusComes[] = [];
  for (const item of saved) {
    if (kept.length >= FOCUS_RULES.maxComites) break;
    const comes = sanitizeComes(item);
    if (comes && !kept.some((other) => other.packageName === comes.packageName)) kept.push(comes);
  }
  return kept;
}

/** Adds an app, or removes it when it is already kept. Adding past three does nothing. */
export function toggleComes(comites: readonly FocusComes[], app: FocusComes): FocusComes[] {
  if (comites.some((comes) => comes.packageName === app.packageName)) {
    return comites.filter((comes) => comes.packageName !== app.packageName);
  }
  return sanitizeComites([...comites, app]);
}

/** What the guard lets through: the Comites and the Phone app (the native side adds Vinco and calls). */
export function allowedPackagesFor(comites: readonly FocusComes[], dialerPackage: string | null): string[] {
  const packages = comites.map((comes) => comes.packageName);
  if (dialerPackage && isPackageName(dialerPackage)) packages.push(dialerPackage);
  return [...new Set(packages)];
}

function sanitizeComes(value: unknown): FocusComes | null {
  if (value == null || typeof value !== 'object') return null;
  const { packageName, label, icon } = value as Record<string, unknown>;
  if (!isPackageName(packageName)) return null;
  const name = typeof label === 'string' ? label.trim().slice(0, MAX_LABEL_LENGTH) : '';
  const isIcon = typeof icon === 'string' && icon.startsWith('data:image/') && icon.length <= MAX_ICON_LENGTH;
  return { packageName, label: name.length > 0 ? name : packageName, icon: isIcon ? icon : null };
}
