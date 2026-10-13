import { todayCopy } from '@/copy';
import { type ArcKind, getArcPosition } from '@/features/arc';
import { type DayKey, dayOfArc } from '@/lib/dates';
import { toRoman } from '@/lib/toRoman';

export type ArcHeader = {
  eyebrow: string;
  stampTitle: string;
  /** A campaign past its last day: Today offers what next. */
  isFinished: boolean;
};

/**
 * Today's eyebrow and the stamp's title, from where today falls in the arc:
 * "Day XII of LX" in a campaign, "Free training · Day XII" in free training.
 */
export function describeArcHeader(
  arc: { kind: ArcKind; startDay: DayKey; lengthDays: number } | null,
  today: DayKey,
): ArcHeader {
  if (!arc) return { eyebrow: todayCopy.eyebrow, stampTitle: todayCopy.stamp.title, isFinished: false };
  if (arc.kind === 'ludus') {
    const dayRoman = toRoman(Math.min(3999, Math.max(1, dayOfArc(arc.startDay, today))));
    return {
      eyebrow: todayCopy.ludusEyebrow(dayRoman),
      stampTitle: todayCopy.stamp.titleWithDay(dayRoman),
      isFinished: false,
    };
  }
  const position = getArcPosition(arc.startDay, arc.lengthDays, today);
  if (position.phase === 'finished') {
    return { eyebrow: todayCopy.arcFinishedEyebrow, stampTitle: todayCopy.stamp.title, isFinished: true };
  }
  if (position.phase === 'notStarted')
    return { eyebrow: todayCopy.eyebrow, stampTitle: todayCopy.stamp.title, isFinished: false };
  const dayRoman = toRoman(position.dayNumber);
  return {
    eyebrow: todayCopy.arcEyebrow(dayRoman, toRoman(position.lengthDays)),
    stampTitle: todayCopy.stamp.titleWithDay(dayRoman),
    isFinished: false,
  };
}
