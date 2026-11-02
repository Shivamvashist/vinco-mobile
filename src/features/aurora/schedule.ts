import { type AuroraMission, type AuroraSettings, getNextRing, type Weekday } from './aurora';

/** What the app asks the native alarm to do after a settings change, a foreground or a ring. */
export type AuroraPlan =
  | { kind: 'cancel' }
  | {
      kind: 'schedule';
      ringAt: Date;
      /** The repeat rule, so the phone can set the next ring itself after a ring or a reboot. */
      minutes: number;
      daysMask: number;
    };

/** Bit 0 = Monday ... bit 6 = Sunday, the form the native module keeps. */
export function toDaysMask(days: readonly Weekday[]): number {
  return days.reduce<number>((mask, day) => mask | (1 << day), 0);
}

/** Schedule the next ring from the settings, or cancel when Aurora is off or has no days. */
export function planAuroraRing(settings: AuroraSettings, now: Date): AuroraPlan {
  const ringAt = getNextRing(settings, now);
  if (!ringAt) return { kind: 'cancel' };
  return { kind: 'schedule', ringAt, minutes: settings.minutes, daysMask: toDaysMask(settings.days) };
}

/** True when the two plans set the same ring, so nothing needs to be sent again. */
export function isSamePlan(a: AuroraPlan | null, b: AuroraPlan): boolean {
  if (a == null || a.kind !== b.kind) return false;
  if (a.kind === 'cancel' || b.kind === 'cancel') return true;
  return a.ringAt.getTime() === b.ringAt.getTime() && a.minutes === b.minutes && a.daysMask === b.daysMask;
}

/** The missions built so far. The rest fall back to the march until they ship. */
export const BUILT_MISSIONS: readonly AuroraMission[] = ['march', 'gladius'];

export function isMissionBuilt(mission: AuroraMission): boolean {
  return BUILT_MISSIONS.includes(mission);
}

/** The mission the ring screen actually runs. */
export function missionToRun(mission: AuroraMission): AuroraMission {
  return isMissionBuilt(mission) ? mission : 'march';
}

/** How the alarm was stopped. Only the mission can earn the first-try denarii. */
export type AuroraStop = 'mission' | 'pass' | 'sick';

/**
 * Beating Aurora on the first try: the mission done while the alarm was still ringing (not after
 * the 10-minute safety stop). There is no snooze, so there is no second try to count.
 */
export function earnsFirstTry(stop: AuroraStop, wasRinging: boolean): boolean {
  return stop === 'mission' && wasRinging;
}
