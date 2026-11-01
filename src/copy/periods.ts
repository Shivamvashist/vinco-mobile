import type { Period, PeriodBucket, PeriodKind } from '@/features/periods';
import { addDays, type DayKey, parseDayKey, weekdayIndex } from '@/lib/dates';

import { commonCopy } from './common';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Monday first, like the charts. */
const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const KIND_NAMES: Record<PeriodKind, string> = { day: 'Day', week: 'Week', month: 'Month', year: 'Year' };

/** "27 Oct", or "29 Dec 2025" with the year. */
function shortDay(day: DayKey, withYear = false): string {
  const parts = parseDayKey(day);
  const label = `${parts.day} ${SHORT_MONTHS[parts.month - 1] ?? ''}`;
  return withYear ? `${label} ${parts.year}` : label;
}

/** The words of the history charts: the switch, the navigator's labels and each bar's name. */
export const periodsCopy = {
  kinds: KIND_NAMES,
  options: (kinds: readonly PeriodKind[]): { value: PeriodKind; label: string }[] =>
    kinds.map((kind) => ({ value: kind, label: KIND_NAMES[kind] })),

  /** "Today", "Yesterday", "27 Oct to 2 Nov", "October 2026", "2026". */
  label: (period: Period, today: DayKey): string => {
    const { year, month } = parseDayKey(period.start);
    const thisYear = parseDayKey(today).year;
    switch (period.kind) {
      case 'day':
        if (period.start === today) return 'Today';
        if (period.start === addDays(today, -1)) return 'Yesterday';
        return `${commonCopy.weekdays[weekdayIndex(period.start)] ?? ''} ${commonCopy.dayLabel(period.start, today)}`;
      case 'week': {
        const endYear = parseDayKey(period.end).year;
        if (year !== endYear) return `${shortDay(period.start, true)} to ${shortDay(period.end, true)}`;
        return `${shortDay(period.start)} to ${shortDay(period.end, year !== thisYear)}`;
      }
      case 'month':
        return `${commonCopy.months[month - 1] ?? ''} ${year}`;
      case 'year':
        return String(year);
    }
  },

  previous: (kind: PeriodKind): string => `Previous ${KIND_NAMES[kind].toLowerCase()}`,
  next: (kind: PeriodKind): string => `Next ${KIND_NAMES[kind].toLowerCase()}`,

  /** Under a bar: "M", "15", "O". Month days are thinned out by the chart. */
  axisLabel: (kind: PeriodKind, bucket: PeriodBucket): string => {
    if (kind === 'year') return MONTH_INITIALS[bucket.index] ?? '';
    if (kind === 'month') return String(parseDayKey(bucket.start).day);
    return WEEKDAY_INITIALS[(weekdayIndex(bucket.start) + 6) % 7] ?? '';
  },

  /** A bar's name, spoken and shown when tapped: "Monday 27 October", "October 2026". */
  bucketName: (kind: PeriodKind, bucket: PeriodBucket, today: DayKey): string => {
    if (kind === 'year') {
      const { year, month } = parseDayKey(bucket.start);
      return `${commonCopy.months[month - 1] ?? ''} ${year}`;
    }
    return `${commonCopy.weekdays[weekdayIndex(bucket.start)] ?? ''} ${commonCopy.dayLabel(bucket.start, today)}`;
  },

  /** A11y for a bar still to come. */
  notYet: (name: string): string => `${name}: still to come`,
  tapHint: 'Tap a bar to see its value',
  /** The chart's top value, for screen readers. */
  scaleLabel: (top: string): string => `Scale up to ${top}`,
} as const;
