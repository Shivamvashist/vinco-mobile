import { MINUTES_IN_DAY, minutesOfDay } from './placement';

/** What rides the day path in the hero's sky view: the sun by day, the moon by night. */
export type SkyBody = 'sun' | 'moon';

/** The sun's hours on the hero, local time: from 06:00 until 19:00. A look, not an almanac. */
export const SKY_HOURS = { sunrise: 6, sunset: 19 } as const;

/** The sun from sunrise until sunset, the moon otherwise. An unreadable date reads as day. */
export function skyBodyAt(at: Date): SkyBody {
  const hour = at.getHours();
  if (Number.isNaN(hour)) return 'sun';
  return hour >= SKY_HOURS.sunrise && hour < SKY_HOURS.sunset ? 'sun' : 'moon';
}

/** Whole minutes left until midnight, by the time of day now (0 to 1440). */
export function minutesLeftInDay(at: Date): number {
  const minutes = minutesOfDay(at);
  if (!Number.isFinite(minutes)) return 0;
  return Math.max(0, Math.min(MINUTES_IN_DAY, Math.ceil(MINUTES_IN_DAY - minutes)));
}
