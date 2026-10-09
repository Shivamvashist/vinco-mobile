import { addDays, type DayKey, weekdayIndex } from '@/lib/dates';

import { getOrderStatus, type OrderTarget } from '../orders';
import { SLEEP } from '../sleep';

/**
 * The Commentarii: Caesar's campaign notes, Vinco's logs. Pure helpers that turn a week of
 * records into chart bars and a few honest numbers. See docs/DAY-FLOW.md, section 4.
 */
export type LogKind = 'sleep' | 'water' | 'workout' | 'weight';

export const LOG_KINDS: readonly LogKind[] = ['sleep', 'water', 'workout', 'weight'];

/** How a bar reads: hit the full goal, held the minimum, fell short, or a sleep-only tone. */
export type BarTone = 'full' | 'held' | 'short' | 'rest' | 'empty';

export type WeekBar = {
  day: DayKey;
  /** The value, or null when nothing was logged (or the day is outside the arc or still to come). */
  value: number | null;
  tone: BarTone;
};

/** The Monday that starts the week a day falls in. */
export function weekStartOf(day: DayKey): DayKey {
  return addDays(day, -((weekdayIndex(day) + 6) % 7));
}

/** The seven days of the week starting on a Monday. */
export function weekDays(weekStart: DayKey): DayKey[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

/** Sleep bars: the sleep colour, porphyry under 6 hours. Values in minutes. */
export function sleepBars(days: readonly DayKey[], minutesByDay: ReadonlyMap<DayKey, number>): WeekBar[] {
  return days.map((day) => {
    const value = minutesByDay.get(day) ?? null;
    if (value == null) return { day, value, tone: 'empty' };
    return { day, value, tone: value < SLEEP.shortMinutes ? 'short' : 'rest' };
  });
}

/** Order bars (water, workout): gold at the full goal, outlined at the minimum, porphyry under it. */
export function orderBars(
  days: readonly DayKey[],
  amountByDay: ReadonlyMap<DayKey, number>,
  target: OrderTarget,
): WeekBar[] {
  return days.map((day) => {
    const value = amountByDay.get(day) ?? null;
    if (value == null) return { day, value, tone: 'empty' };
    const status = getOrderStatus(value, target);
    return { day, value, tone: status === 'full' ? 'full' : status === 'min' ? 'held' : 'short' };
  });
}

export type WeekSummary = {
  /** Days with a value. */
  loggedDays: number;
  /** Average over logged days, or null if none. */
  average: number | null;
  total: number;
  /** The best day (highest value), or null if none. */
  best: { day: DayKey; value: number } | null;
  /** Days that reached `goal`, when one is given. */
  daysAtGoal: number;
};

/** Average, total, best day and days at goal for a week of bars. */
export function summarizeBars(bars: readonly WeekBar[], goal?: number): WeekSummary {
  const logged = bars.filter((bar): bar is WeekBar & { value: number } => bar.value != null);
  const total = logged.reduce((sum, bar) => sum + bar.value, 0);
  const best = logged.reduce<{ day: DayKey; value: number } | null>(
    (top, bar) => (top == null || bar.value > top.value ? { day: bar.day, value: bar.value } : top),
    null,
  );
  return {
    loggedDays: logged.length,
    average: logged.length > 0 ? total / logged.length : null,
    total,
    best,
    daysAtGoal: goal == null ? 0 : logged.filter((bar) => bar.value >= goal).length,
  };
}

export type WeightPoint = { day: DayKey; kg: number };

export type WeightTrend = {
  /** This week's average (Monday start), or null if nothing logged this week. */
  thisWeek: number | null;
  /** Last week's average, or null. */
  lastWeek: number | null;
  /** thisWeek minus lastWeek, rounded to 0.1 kg; null unless both exist. */
  change: number | null;
};

/** Weekly averages around today: weight is read as a trend, never a single day. */
export function weightTrend(points: readonly WeightPoint[], today: DayKey): WeightTrend {
  const thisStart = weekStartOf(today);
  const lastStart = addDays(thisStart, -7);
  const average = (from: DayKey, to: DayKey) => {
    const inWeek = points.filter((point) => point.day >= from && point.day <= to);
    return inWeek.length > 0 ? inWeek.reduce((sum, point) => sum + point.kg, 0) / inWeek.length : null;
  };
  const thisWeek = average(thisStart, addDays(thisStart, 6));
  const lastWeek = average(lastStart, addDays(lastStart, 6));
  const change = thisWeek != null && lastWeek != null ? Math.round((thisWeek - lastWeek) * 10) / 10 : null;
  return { thisWeek, lastWeek, change };
}

/** A chart's top value: the largest of the values and the target, with a little headroom. */
export function chartMax(values: readonly (number | null)[], target: number): number {
  const largest = Math.max(target, ...values.map((value) => value ?? 0));
  return largest > 0 ? largest * 1.15 : 1;
}
