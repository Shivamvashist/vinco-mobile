import { parseDayKey, type DayKey } from '@/lib/dates';

import type { ReminderDay, StreakRewardAhead } from './days';
import {
  REMINDER_ID_PREFIX,
  REMINDER_KINDS,
  REMINDER_RULES,
  type ReminderKind,
  type ReminderSettings,
} from './rules';

/** What a reminder says, as data. The words come from src/copy (notificationsCopy), in the user's tone. */
export type ReminderMessage =
  | { kind: 'morning'; isLudus: boolean; orderCount: number }
  | { kind: 'evening'; isLudus: boolean; ordersLeft: number; reward: StreakRewardAhead | null }
  | { kind: 'lastCall'; campaign: number }
  | { kind: 'truceWindow'; campaignSaved: number };

export type PlannedReminder = {
  /** Stable per day and kind, so a rewrite replaces rather than duplicates. */
  id: string;
  kind: ReminderKind;
  day: DayKey;
  fireAt: Date;
  /** The in-app path a tap opens. */
  url: string;
  message: ReminderMessage;
};

export type ReminderPlanInput = {
  settings: ReminderSettings;
  /** Today and the next days (buildReminderDays). */
  days: readonly ReminderDay[];
  now: Date;
};

/** Every default reminder opens Today, where each one's job is done. */
const TODAY_URL = '/veni';

/**
 * The reminders to schedule: each day's candidates, at most three a day (highest priority kept),
 * none in quiet hours or in the past. Nothing at all when reminders are off.
 */
export function planReminders({ settings, days, now }: ReminderPlanInput): PlannedReminder[] {
  if (!settings.isOn) return [];
  const nowMs = now.getTime();
  return days.flatMap((facts) => {
    const candidates = getCandidates(facts, settings).filter(
      (reminder) =>
        settings.kinds[reminder.kind] &&
        reminder.fireAt.getTime() > nowMs &&
        !isQuietTime(minutesOf(reminder.fireAt), facts.wakeMinutes),
    );
    return applyDailyCap(candidates, REMINDER_RULES.maxPerDay);
  });
}

/** Keeps the highest-priority reminders (REMINDER_KINDS order), then sorts them by time. */
export function applyDailyCap(reminders: readonly PlannedReminder[], max: number): PlannedReminder[] {
  const rank = (kind: ReminderKind) => REMINDER_KINDS.indexOf(kind);
  return [...reminders]
    .sort((a, b) => rank(a.kind) - rank(b.kind))
    .slice(0, Math.max(0, max))
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

/** Quiet hours: from 11 pm until the planned wake time (never past noon). */
export function isQuietTime(minutes: number, wakeMinutes: number): boolean {
  const quietEnd = Math.min(Math.max(0, wakeMinutes), REMINDER_RULES.quietEndLatestMinutes);
  return minutes >= REMINDER_RULES.quietStartMinutes || minutes < quietEnd;
}

/** A local moment on a calendar day, built from its parts so daylight saving can't shift the clock. */
export function atLocalTime(day: DayKey, minutes: number): Date {
  const { year, month, day: date } = parseDayKey(day);
  return new Date(year, month - 1, date, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

export function reminderId(day: DayKey, kind: ReminderKind): string {
  return `${REMINDER_ID_PREFIX}${day}.${kind}`;
}

/** Every reminder the day qualifies for, before toggles, quiet hours, the past and the cap. */
function getCandidates(facts: ReminderDay, settings: ReminderSettings): PlannedReminder[] {
  // A sick day rests; a day already held needs nothing; a day without orders can't hold.
  if (facts.isSickDay || facts.isHeld || facts.totalCount === 0) return [];
  const make = (kind: ReminderKind, minutes: number, message: ReminderMessage): PlannedReminder => ({
    id: reminderId(facts.day, kind),
    kind,
    day: facts.day,
    fireAt: atLocalTime(facts.day, minutes),
    url: TODAY_URL,
    message,
  });
  const list: PlannedReminder[] = [];
  const morningMinutes = facts.wakeMinutes + REMINDER_RULES.morningOffsetMinutes;

  // The Truce window takes the morning slot: one morning reminder, the one that matters more.
  const hasTruceWindow = !facts.isLudus && facts.truceOffer != null && settings.kinds.truceWindow;
  if (hasTruceWindow && facts.truceOffer) {
    list.push(
      make('truceWindow', morningMinutes, {
        kind: 'truceWindow',
        campaignSaved: facts.truceOffer.campaignSaved,
      }),
    );
  } else if (!facts.hasAnyLog) {
    list.push(
      make('morning', morningMinutes, {
        kind: 'morning',
        isLudus: facts.isLudus,
        orderCount: facts.totalCount,
      }),
    );
  }

  list.push(
    make('evening', settings.eveningMinutes, {
      kind: 'evening',
      isLudus: facts.isLudus,
      ordersLeft: facts.ordersLeft,
      reward: facts.streakReward,
    }),
  );

  if (!facts.isLudus && facts.campaignBefore >= REMINDER_RULES.lastCallMinCampaign) {
    list.push(
      make('lastCall', REMINDER_RULES.lastCallMinutes, {
        kind: 'lastCall',
        campaign: facts.campaignBefore,
      }),
    );
  }
  return list;
}

function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
