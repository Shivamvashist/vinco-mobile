import { SLEEP } from './sleep';

/**
 * Last night's rest as the phone saw it: when the screen went dark for the night and when it
 * came back on (modules/vigil VigilNight.kt). An estimate only: a dark screen is not sleep.
 */
export type NightRest = { sleptAt: Date; wokeAt: Date };

/** The native reply in a safe shape, or null for anything missing or broken. */
export function toNightRest(raw: unknown): NightRest | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { sleptAt, wokeAt } = raw as { sleptAt?: unknown; wokeAt?: unknown };
  if (typeof sleptAt !== 'number' || typeof wokeAt !== 'number') return null;
  if (!Number.isFinite(sleptAt) || !Number.isFinite(wokeAt) || sleptAt <= 0 || wokeAt <= sleptAt) return null;
  return { sleptAt: new Date(sleptAt), wokeAt: new Date(wokeAt) };
}

/**
 * The bedtime to use for a wake-up at `wakeAt`, or null when the estimate doesn't fit it. It fits
 * when the phone's night started before the wake-up and the sleep it gives lies within
 * SLEEP.minMinutes to SLEEP.maxMinutes: so last week's night, or one that hasn't begun, never is.
 */
export function getUsableBedtime(rest: NightRest | null, wakeAt: Date): Date | null {
  if (!rest) return null;
  const sleptAt = rest.sleptAt.getTime();
  const wake = wakeAt.getTime();
  if (!Number.isFinite(sleptAt) || !Number.isFinite(wake)) return null;
  const minutes = (wake - sleptAt) / 60000;
  if (minutes < SLEEP.minMinutes || minutes > SLEEP.maxMinutes) return null;
  return rest.sleptAt;
}
