import type { DayActivity, FocusMarkStyle } from './activity';

/** The colour family of a mark: orders (accent), focus (info), everything else (muted). */
export type ActivityFamily = 'order' | 'focus' | 'log';

/** One activity's spot on the path, 0 (the day's start) to 1 (midnight). */
export type PathPoint = { id: string; position: number; family: ActivityFamily };

/** A focus as a stretch of the path. */
export type PathSpan = { id: string; from: number; to: number; style: FocusMarkStyle };

/** Marks close together, drawn as one dot (a little larger with more). Key: its earliest id. */
export type PathCluster = {
  key: string;
  position: number;
  family: ActivityFamily;
  count: number;
  ids: string[];
};

export const MINUTES_IN_DAY = 24 * 60;

/** When ties break between families in a cluster: orders lead, then focus, then logs. */
const FAMILY_RANK: Record<ActivityFamily, number> = { order: 0, focus: 1, log: 2 };

/** The local time of day in minutes (seconds as a fraction), in the phone's time zone now. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

/**
 * Where the path starts, in minutes after midnight: when the user woke, else the planned wake
 * time, else midnight (free training without a wake order).
 */
export function dayStartMinutes(wokeAt: Date | null, plannedWakeMinutes: number | null): number {
  const minutes =
    wokeAt && !Number.isNaN(wokeAt.getTime()) ? Math.floor(minutesOfDay(wokeAt)) : (plannedWakeMinutes ?? 0);
  return Number.isFinite(minutes) ? Math.min(MINUTES_IN_DAY - 1, Math.max(0, minutes)) : 0;
}

/**
 * A moment's position on the path, 0 (start) to 1 (midnight), by its time of day. Only the time
 * of day counts, so the dev clock (whole days ahead) and a time zone change move every mark and
 * the now dot together. Anything before the start sits at the start: the left edge stays the
 * wake time, and a late to-do or an early water never moves the dot for now.
 */
export function placeOnPath(at: Date, startMinutes: number): number {
  if (Number.isNaN(at.getTime())) return 0;
  const span = Math.max(1, MINUTES_IN_DAY - startMinutes);
  return clamp01((minutesOfDay(at) - startMinutes) / span);
}

export function familyOf(kind: DayActivity['kind']): ActivityFamily {
  switch (kind) {
    case 'order':
    case 'wake':
      return 'order';
    case 'focus':
      return 'focus';
    case 'task':
    case 'selfie':
    case 'weight':
    case 'calories':
    case 'reward':
    case 'truce':
      return 'log';
  }
}

/** The day's activity on the path: dots for moments, spans for focus sessions. */
export function toPathMarks(
  items: readonly DayActivity[],
  startMinutes: number,
): { points: PathPoint[]; spans: PathSpan[] } {
  const points: PathPoint[] = [];
  const spans: PathSpan[] = [];
  for (const item of items) {
    const position = placeOnPath(item.at, startMinutes);
    if (item.kind === 'focus') {
      const to = placeOnPath(item.until ?? item.at, startMinutes);
      spans.push({ id: item.id, from: position, to: Math.max(position, to), style: item.focus ?? 'held' });
    } else {
      points.push({ id: item.id, position, family: familyOf(item.kind) });
    }
  }
  return { points, spans };
}

/**
 * Merges marks too close to tell apart into one dot, so dozens of water taps never smear.
 * Walking left to right, a cluster takes every mark within `minGap` of its first mark (so it can
 * never chain across the whole path); it sits at its members' mean, in the family most of them
 * share (ties: orders, focus, logs).
 */
export function clusterPathPoints(points: readonly PathPoint[], minGap: number): PathCluster[] {
  const gap = Number.isFinite(minGap) ? Math.max(0, minGap) : 0;
  const sorted = [...points].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  const groups: PathPoint[][] = [];
  for (const point of sorted) {
    const group = groups.at(-1);
    const first = group?.[0];
    if (group && first && point.position - first.position <= gap) group.push(point);
    else groups.push([point]);
  }
  return groups.map((group) => ({
    key: group[0]?.id ?? '',
    position: group.reduce((sum, point) => sum + point.position, 0) / group.length,
    family: leadingFamily(group),
    count: group.length,
    ids: group.map((point) => point.id),
  }));
}

function leadingFamily(group: readonly PathPoint[]): ActivityFamily {
  const counts: Record<ActivityFamily, number> = { order: 0, focus: 0, log: 0 };
  group.forEach((point) => (counts[point.family] += 1));
  return (
    (Object.keys(counts) as ActivityFamily[]).sort(
      (a, b) => counts[b] - counts[a] || FAMILY_RANK[a] - FAMILY_RANK[b],
    )[0] ?? 'log'
  );
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
