/**
 * Aurora, the alarm: rings at the wake-up time on chosen days and stops only after a mission.
 * Ringing needs the native Aurora module (docs/GUARDIANS.md); the rules and timing live here.
 */
export type AuroraMission = 'sky' | 'post' | 'march';

export const AURORA_MISSIONS: readonly AuroraMission[] = ['march', 'sky', 'post'];

/** 0 = Monday ... 6 = Sunday, matching the rest of the app's weeks. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const ALL_WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export type AuroraSettings = {
  isOn: boolean;
  /** Minutes after midnight. Follows the arc's wake-up time unless the user sets its own. */
  minutes: number;
  days: readonly Weekday[];
  mission: AuroraMission;
};

export const AURORA_RULES = {
  /** March: steps to stop the alarm. */
  marchSteps: 30,
  /** Beating it on the first try pays this many denarii. */
  firstTryDenarii: 2,
} as const;

export const DEFAULT_AURORA_SETTINGS: AuroraSettings = {
  isOn: false,
  minutes: 6 * 60 + 30,
  days: ALL_WEEKDAYS,
  mission: 'march',
};

export function isAuroraMission(value: unknown): value is AuroraMission {
  return typeof value === 'string' && (AURORA_MISSIONS as readonly string[]).includes(value);
}

/** Keeps only valid saved settings; anything else falls back to the default. */
export function sanitizeAuroraSettings(saved: unknown): AuroraSettings {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  const minutes =
    typeof value.minutes === 'number' &&
    Number.isInteger(value.minutes) &&
    value.minutes >= 0 &&
    value.minutes < 1440
      ? value.minutes
      : DEFAULT_AURORA_SETTINGS.minutes;
  const days = Array.isArray(value.days)
    ? [...new Set(value.days.filter((day): day is Weekday => ALL_WEEKDAYS.includes(day as Weekday)))].sort(
        (a, b) => a - b,
      )
    : [...DEFAULT_AURORA_SETTINGS.days];
  return {
    isOn: typeof value.isOn === 'boolean' ? value.isOn : DEFAULT_AURORA_SETTINGS.isOn,
    minutes,
    days,
    mission: isAuroraMission(value.mission) ? value.mission : DEFAULT_AURORA_SETTINGS.mission,
  };
}

/** Monday-first weekday of a date (0 = Monday). */
function mondayFirst(date: Date): Weekday {
  return ((date.getDay() + 6) % 7) as Weekday;
}

/**
 * When Aurora rings next, from `now` (local time), or null when it is off or no day is chosen.
 * A time already past today moves to the next chosen day.
 */
export function getNextRing(settings: AuroraSettings, now: Date): Date | null {
  if (!settings.isOn || settings.days.length === 0) return null;
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(Math.floor(settings.minutes / 60), settings.minutes % 60, 0, 0);
    if (candidate.getTime() > now.getTime() && settings.days.includes(mondayFirst(candidate))) {
      return candidate;
    }
  }
  return null;
}
