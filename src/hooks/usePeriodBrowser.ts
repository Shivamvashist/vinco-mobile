import { useState } from 'react';

import {
  clampDay,
  type Period,
  type PeriodKind,
  type PeriodNavigation,
  periodNavigation,
  periodOf,
  shiftPeriod,
} from '@/features/periods';
import type { DayKey } from '@/lib/dates';

export type PeriodBrowser = PeriodNavigation & {
  kind: PeriodKind;
  period: Period;
  setKind: (kind: PeriodKind) => void;
  goBack: () => void;
  goForward: () => void;
};

/**
 * Which period a history chart shows, and the steps through time. Switching the kind keeps the
 * day in view (October 2025, switched to Week, shows a week of October 2025). Until the user steps
 * back, the view follows today, so it moves on by itself at midnight.
 * @param floor the first day with history, or null when there is none (back stays off)
 */
export function usePeriodBrowser(
  initialKind: PeriodKind,
  floor: DayKey | null,
  today: DayKey,
): PeriodBrowser {
  const [kind, setKind] = useState<PeriodKind>(initialKind);
  // null follows today.
  const [anchor, setAnchor] = useState<DayKey | null>(null);
  const period = periodOf(kind, clampDay(anchor ?? today, floor, today));
  const navigation = periodNavigation(period, floor, today);

  return {
    kind,
    period,
    ...navigation,
    setKind,
    goBack: () => {
      if (!navigation.canGoBack) return;
      setAnchor(shiftPeriod(period, -1).end);
    },
    goForward: () => {
      if (!navigation.canGoForward) return;
      const next = shiftPeriod(period, 1);
      setAnchor(next.end >= today ? null : next.start);
    },
  };
}
