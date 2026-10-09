import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectDayLogsBetween, selectOrderLogsBetween, selectWeightsBetween } from '@/db';
import { arcEndDay } from '@/features/arc';
import {
  orderBars,
  sleepBars,
  summarizeBars,
  type WeekBar,
  weekDays,
  type WeekSummary,
  type WeightPoint,
  type WeightTrend,
  weightTrend,
} from '@/features/logs';
import type { OrderTargets } from '@/features/orders';
import { sleepMinutesFromMoments } from '@/features/sleep';
import { addDays, type DayKey } from '@/lib/dates';

export type Commentarii = {
  sleep: { bars: WeekBar[]; summary: WeekSummary };
  water: { bars: WeekBar[]; summary: WeekSummary };
  workout: { bars: WeekBar[]; summary: WeekSummary };
  /** Every weight logged in the arc so far, oldest first. */
  weights: WeightPoint[];
  weightTrend: WeightTrend;
  isLoaded: boolean;
};

type ArcInfo = { startDay: DayKey; lengthDays: number };

/**
 * One week of the logs (sleep, water, workout) and the arc's weights, live from SQLite.
 * Days outside the arc or still to come stay empty. A past arc day with nothing tapped
 * counts as 0 for water and workout (nothing was done), but sleep stays empty (not logged).
 */
export function useCommentarii(
  arc: ArcInfo,
  targets: OrderTargets,
  weekStart: DayKey,
  today: DayKey,
): Commentarii {
  const weekEnd = addDays(weekStart, 6);
  const dayRows = useLiveQuery(selectDayLogsBetween(db, weekStart, weekEnd), [weekStart, weekEnd]);
  const orderRows = useLiveQuery(selectOrderLogsBetween(db, weekStart, weekEnd), [weekStart, weekEnd]);
  const weightRows = useLiveQuery(selectWeightsBetween(db, arc.startDay, today), [arc.startDay, today]);

  const lastDay = arcEndDay(arc.startDay, arc.lengthDays);
  const days = weekDays(weekStart);
  const isCounted = (day: DayKey) => day >= arc.startDay && day <= today && day <= lastDay;

  const sleepByDay = new Map<DayKey, number>();
  for (const row of dayRows.data) {
    const minutes = sleepMinutesFromMoments(row.sleptAt, row.wokeAt);
    if (minutes != null && isCounted(row.day)) sleepByDay.set(row.day, minutes);
  }

  const amountsFor = (kind: 'water' | 'workout') => {
    const byDay = new Map<DayKey, number>();
    for (const day of days) if (isCounted(day)) byDay.set(day, 0);
    for (const row of orderRows.data) {
      if (row.kind === kind && isCounted(row.day) && Number.isFinite(row.amount)) {
        byDay.set(row.day, row.amount);
      }
    }
    return byDay;
  };

  const sleep = sleepBars(days, sleepByDay);
  const water = orderBars(days, amountsFor('water'), targets.water);
  const workout = orderBars(days, amountsFor('workout'), targets.workout);
  const weights = weightRows.data.flatMap((row) =>
    row.weightKg != null && Number.isFinite(row.weightKg) ? [{ day: row.day, kg: row.weightKg }] : [],
  );

  return {
    sleep: { bars: sleep, summary: summarizeBars(sleep) },
    water: { bars: water, summary: summarizeBars(water, targets.water.full) },
    workout: { bars: workout, summary: summarizeBars(workout, targets.workout.full) },
    weights,
    weightTrend: weightTrend(weights, today),
    isLoaded:
      dayRows.updatedAt !== undefined &&
      orderRows.updatedAt !== undefined &&
      weightRows.updatedAt !== undefined,
  };
}
