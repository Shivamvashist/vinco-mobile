import { arcCopy, commonCopy, progressCopy, type TabName, tabsCopy } from '@/copy';
import { type ArcKind, isArcLength } from '@/features/arc';
import { type DayKey, weekdayIndex } from '@/lib/dates';

import { describeArcHeader } from '../today/describeArcHeader';

export type TabHeaderText = { eyebrow: string; title: string };

type HeaderArc = { kind: ArcKind; startDay: DayKey; lengthDays: number } | null;

/**
 * The left side of the shared tabs header, per tab. Two lines only (eyebrow and title), so the
 * header keeps one height on every tab and nothing below it jumps on a tab change.
 * Veni: "DAY XII OF LX" over the weekday. Vidi: the proof. Vici: the arc's name.
 */
export function describeTabHeader(tab: TabName, arc: HeaderArc, today: DayKey): TabHeaderText {
  switch (tab) {
    case 'veni':
      return {
        eyebrow: describeArcHeader(arc, today).eyebrow,
        title: commonCopy.weekdays[weekdayIndex(today)] ?? '',
      };
    case 'vidi':
      return { eyebrow: progressCopy.eyebrow, title: progressCopy.title };
    case 'vici':
      return { eyebrow: arcCopy.eyebrow, title: arcTitle(arc) };
    case 'settings':
      // Castra lives in the user menu now, not in the tabs; kept so every tab name has words.
      return { eyebrow: tabsCopy.settings.meaning, title: tabsCopy.settings.plain };
  }
}

function arcTitle(arc: HeaderArc): string {
  if (!arc) return arcCopy.title;
  if (arc.kind === 'ludus') return arcCopy.ludusName;
  return isArcLength(arc.lengthDays) ? arcCopy.names[arc.lengthDays] : arcCopy.fallbackName;
}
