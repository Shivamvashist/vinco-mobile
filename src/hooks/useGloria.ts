import { type DayGloria, getDayGloria, type JourneyDay, sumGloria, weekGloria } from '@/features/gloria';
import { weekStartOf } from '@/features/logs';
import type { DayKey } from '@/lib/dates';

import { useJourney } from './useJourney';
import { useToday } from './useToday';

export type Gloria = {
  today: DayKey;
  /** Every Gloria earned on the journey, claims included. */
  total: number;
  byDay: ReadonlyMap<DayKey, number>;
  /** This week, Monday to Sunday (days still to come read 0). */
  thisWeek: { day: DayKey; gloria: number }[];
  /** A day's Gloria by source, or null outside the journey. */
  breakdownOf: (day: DayKey) => DayGloria | null;
  /** A day's facts (orders, focus, claims...), or null outside the journey. */
  dayOf: (day: DayKey) => JourneyDay | null;
  /** The journey's first day (the earliest arc's start), or null before onboarding. */
  firstDay: DayKey | null;
  isLoaded: boolean;
};

/** Gloria (glory points) across the whole journey, derived live from the records. */
export function useGloria(): Gloria {
  const today = useToday();
  const journey = useJourney(null, today);
  const { total, byDay } = sumGloria(journey.days.values());
  return {
    today,
    total,
    byDay,
    thisWeek: weekGloria(weekStartOf(today), byDay),
    breakdownOf: (day) => {
      const facts = journey.days.get(day);
      return facts ? getDayGloria(facts) : null;
    },
    dayOf: (day) => journey.days.get(day) ?? null,
    firstDay: journey.firstDay,
    isLoaded: journey.isLoaded,
  };
}
