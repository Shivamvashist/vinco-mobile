import { useState } from 'react';

import { arcEndDay, clampMonth, compareMonths, getCalendarRange, type YearMonth } from '@/features/arc';
import type { DayRecord } from '@/features/campaign';
import { gloriaLevel } from '@/features/gloria';
import { type DayKey, daysBetween, shiftMonth } from '@/lib/dates';

import { type CalendarDay, type CalendarDayStatus, MonthCalendar } from './MonthCalendar';

export type ArcCalendarProps = {
  arc: { startDay: DayKey; lengthDays: number };
  today: DayKey;
  /** The arc's sealed days. */
  records: readonly DayRecord[];
  todayStatus: 'open' | 'held' | 'conquered';
  isLudus: boolean;
  /** Sealed results of the whole journey, for days before this arc. */
  pastResults: ReadonlyMap<DayKey, 'conquered' | 'held' | 'missed'>;
  /** The journey's first sealed day, or null. */
  firstRecordDay: DayKey | null;
  onOpenDay: (day: DayKey, status: CalendarDayStatus) => void;
  /** Gloria per day: each day is tinted by it (features/gloria, gloriaLevel). */
  gloriaByDay?: ReadonlyMap<DayKey, number>;
};

/**
 * The progress calendar, opening on this month. It goes back month by month to the first month
 * with a record or the arc's start (whichever is earlier), and forward to this month. Days with
 * nothing recorded are empty cells. Days of this arc open their summary; days of an earlier
 * arc show only whether they held.
 */
export function ArcCalendar({
  arc,
  today,
  records,
  todayStatus,
  isLudus,
  pastResults,
  firstRecordDay,
  onOpenDay,
  gloriaByDay,
}: ArcCalendarProps) {
  const endDay = arcEndDay(arc.startDay, arc.lengthDays);
  const range = getCalendarRange(arc.startDay, firstRecordDay, today);
  const [shown, setShown] = useState<YearMonth | null>(null);
  const visible = clampMonth(shown ?? range.last, range);
  const results = new Map(records.map((record) => [record.day, record.result]));

  const describeDay = (day: DayKey): CalendarDay => ({
    ...describeResult(day),
    gloriaLevel: gloriaLevel(gloriaByDay?.get(day) ?? 0),
  });

  const describeResult = (day: DayKey): CalendarDay => {
    const isToday = day === today;
    if (daysBetween(arc.startDay, day) < 0 || daysBetween(day, endDay) < 0) {
      // Outside this arc: an earlier arc's held days still show, read only. Anything else is empty.
      const past = pastResults.get(day);
      return past === 'held' || past === 'conquered'
        ? { status: past, isToday, canOpen: false }
        : { status: 'outside', isToday };
    }
    if (isToday) return { status: todayStatus, isToday };
    if (daysBetween(today, day) > 0) return { status: 'future', isToday };
    // A past day not sealed yet (sealing runs on open) reads as open until it is.
    const result = results.get(day) ?? 'open';
    // Free training has no streak: a day without every order done is a day off, not a miss.
    return { status: result === 'missed' && isLudus ? 'rest' : result, isToday };
  };

  return (
    <MonthCalendar
      year={visible.year}
      month={visible.month}
      describeDay={describeDay}
      canGoBack={compareMonths(visible, range.first) > 0}
      canGoForward={compareMonths(visible, range.last) < 0}
      onPrevious={() => setShown(shiftMonth(visible.year, visible.month, -1))}
      onNext={() => setShown(shiftMonth(visible.year, visible.month, 1))}
      onDayPress={(day) => onOpenDay(day, describeDay(day).status)}
      isLudus={isLudus}
      showsGloria={gloriaByDay != null}
    />
  );
}
