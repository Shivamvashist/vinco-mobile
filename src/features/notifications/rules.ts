/**
 * Local reminders: the kinds, their numbers and the user's settings. The plan itself is made in
 * planner.ts; docs/NOTIFICATIONS.md is the product spec. Pure: no Expo, no clock.
 */

/** The default reminders, highest priority first (the order the daily cap keeps them in). */
export const REMINDER_KINDS = ['truceWindow', 'lastCall', 'evening', 'morning'] as const;

export type ReminderKind = (typeof REMINDER_KINDS)[number];

export const REMINDER_RULES = {
  /** Most reminders on one day. The Aurora alarm is separate and never counts. */
  maxPerDay: 3,
  /** Morning orders (and the Truce window, which takes its slot): this long after the wake time. */
  morningOffsetMinutes: 30,
  defaultEveningMinutes: 20 * 60 + 30,
  /** The evening time the user may pick: late afternoon to 10 pm, so it never meets the last call. */
  eveningEarliestMinutes: 16 * 60,
  eveningLatestMinutes: 22 * 60,
  /** Last call, campaign only. */
  lastCallMinutes: 22 * 60 + 45,
  /** Shortest campaign worth a last call: a run that is really at stake. */
  lastCallMinCampaign: 2,
  /** Quiet hours start here and last until the planned wake time. */
  quietStartMinutes: 23 * 60,
  /** Quiet hours never run past noon, even with a late wake time. */
  quietEndLatestMinutes: 12 * 60,
  /** Days planned ahead, today included. */
  daysAhead: 3,
} as const;

/** Identifies Vinco's scheduled reminders among everything else the phone holds for the app. */
export const REMINDER_ID_PREFIX = 'vinco.reminder.';

export type ReminderSettings = {
  /** The master switch. Off cancels every reminder. */
  isOn: boolean;
  kinds: Record<ReminderKind, boolean>;
  /** The evening "seal the day" time, minutes after midnight. */
  eveningMinutes: number;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  isOn: true,
  kinds: { truceWindow: true, lastCall: true, evening: true, morning: true },
  eveningMinutes: REMINDER_RULES.defaultEveningMinutes,
};

export function isReminderKind(value: unknown): value is ReminderKind {
  return typeof value === 'string' && (REMINDER_KINDS as readonly string[]).includes(value);
}

/** Keeps the evening time a whole minute inside the allowed window. Bad values give the default. */
export function clampEveningMinutes(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return REMINDER_RULES.defaultEveningMinutes;
  const whole = Math.round(value);
  return Math.min(
    REMINDER_RULES.eveningLatestMinutes,
    Math.max(REMINDER_RULES.eveningEarliestMinutes, whole),
  );
}

/** Keeps only valid saved settings; anything else falls back to the default. */
export function sanitizeReminderSettings(saved: unknown): ReminderSettings {
  const value = asRecord(saved);
  const kinds = asRecord(value.kinds);
  return {
    isOn: typeof value.isOn === 'boolean' ? value.isOn : DEFAULT_REMINDER_SETTINGS.isOn,
    kinds: Object.fromEntries(
      REMINDER_KINDS.map((kind) => [
        kind,
        typeof kinds[kind] === 'boolean' ? kinds[kind] : DEFAULT_REMINDER_SETTINGS.kinds[kind],
      ]),
    ) as Record<ReminderKind, boolean>,
    eveningMinutes: clampEveningMinutes(value.eveningMinutes),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
