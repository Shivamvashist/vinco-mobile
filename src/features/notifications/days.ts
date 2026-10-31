import { getNextStreakReward, planTrucePayment } from '@/features/campaign';
import { addDays, type DayKey } from '@/lib/dates';

import { REMINDER_RULES } from './rules';

/** What holding a day would pay in streak rewards (the Stipendium), when it pays anything. */
export type StreakRewardAhead = { denarii: number; hasTruce: boolean };

/** The facts one day's reminders depend on. Future days assume nothing is logged yet. */
export type ReminderDay = {
  day: DayKey;
  isLudus: boolean;
  /** Planned wake-up, minutes after midnight. */
  wakeMinutes: number;
  /** Orders that count on the day. */
  totalCount: number;
  /** Orders not yet holding their minimum. */
  ordersLeft: number;
  /** Anything logged on the day yet (wake-up included). */
  hasAnyLog: boolean;
  isHeld: boolean;
  /** A sick-day Truce was called for the day: no reminders at all. */
  isSickDay: boolean;
  /** The campaign (or the free-training run) going into the day. */
  campaignBefore: number;
  /** A Truce can still save a missed run ending the day before, and the user can pay for it. */
  truceOffer: { campaignSaved: number } | null;
  /** What holding the day pays in streak rewards, or null when it pays nothing extra. */
  streakReward: StreakRewardAhead | null;
};

/** Today as the app sees it right now: the input the next days are projected from. */
export type ReminderSnapshot = {
  today: DayKey;
  isLudus: boolean;
  /** First day of the arc. */
  startDay: DayKey;
  /** Last day of the arc, or null when it has no end (free training). */
  lastDay: DayKey | null;
  wakeMinutes: number;
  totalCount: number;
  heldCount: number;
  hasAnyLog: boolean;
  isHeld: boolean;
  isSickDay: boolean;
  /** The campaign as useCampaign counts it: today included once today holds. */
  campaign: number;
  /** Today's Truce offer (a missed run ending yesterday), or null. */
  truceOffer: { days: number; campaignSaved: number; canAfford: boolean } | null;
  truceReserve: number;
  denarii: number;
};

/**
 * Today and the next days, as reminders see them. Future days assume nothing gets logged, so a
 * day that is not held yet is projected as missed (the plan is rewritten the moment it holds).
 * Days outside the arc are left out.
 */
export function buildReminderDays(snapshot: ReminderSnapshot): ReminderDay[] {
  const { today, isLudus } = snapshot;
  const days: ReminderDay[] = [];
  const isInArc = (day: DayKey) =>
    day >= snapshot.startDay && (snapshot.lastDay == null || day <= snapshot.lastDay);

  const todayCampaignBefore = snapshot.isHeld ? Math.max(0, snapshot.campaign - 1) : snapshot.campaign;
  if (isInArc(today)) {
    days.push({
      day: today,
      isLudus,
      wakeMinutes: snapshot.wakeMinutes,
      totalCount: snapshot.totalCount,
      ordersLeft: Math.max(0, snapshot.totalCount - snapshot.heldCount),
      hasAnyLog: snapshot.hasAnyLog,
      isHeld: snapshot.isHeld,
      isSickDay: snapshot.isSickDay,
      campaignBefore: todayCampaignBefore,
      truceOffer:
        !isLudus && snapshot.truceOffer?.canAfford
          ? { campaignSaved: snapshot.truceOffer.campaignSaved }
          : null,
      streakReward: rewardIfHeld(todayCampaignBefore, isLudus),
    });
  }

  // After today: a held day (or a sick-day Truce) keeps the run; anything else ends it,
  // leaving a missed run a Truce could still save.
  const keepsRun = snapshot.isHeld || snapshot.isSickDay;
  let run = keepsRun ? snapshot.campaign : 0;
  let pending: { days: number; campaignSaved: number } | null = keepsRun
    ? null
    : {
        days: (snapshot.truceOffer?.days ?? 0) + 1,
        campaignSaved: snapshot.truceOffer?.campaignSaved ?? snapshot.campaign,
      };

  for (let offset = 1; offset < REMINDER_RULES.daysAhead; offset += 1) {
    const day = addDays(today, offset);
    const canSave =
      !isLudus &&
      pending != null &&
      pending.campaignSaved > 0 &&
      planTrucePayment(pending.days, snapshot.truceReserve, snapshot.denarii).canAfford;
    if (isInArc(day)) {
      days.push({
        day,
        isLudus,
        wakeMinutes: snapshot.wakeMinutes,
        totalCount: snapshot.totalCount,
        ordersLeft: snapshot.totalCount,
        hasAnyLog: false,
        isHeld: false,
        isSickDay: false,
        campaignBefore: run,
        truceOffer: canSave && pending ? { campaignSaved: pending.campaignSaved } : null,
        streakReward: rewardIfHeld(run, isLudus),
      });
    }
    // Projected as missed: the run ends, and the missed run grows.
    pending = pending ? { ...pending, days: pending.days + 1 } : { days: 1, campaignSaved: run };
    run = 0;
  }
  return days;
}

/** The streak reward holding the next day would earn, or null if that day pays nothing extra. */
function rewardIfHeld(campaignBefore: number, isLudus: boolean): StreakRewardAhead | null {
  const next = getNextStreakReward(campaignBefore, !isLudus);
  return next.inDays === 1 ? { denarii: next.denarii, hasTruce: next.hasTruce } : null;
}
