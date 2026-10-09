/**
 * Ranks are earned by completed days, never bought. Thresholds are a first guess,
 * to be tuned with Early Access data (see HISTORY.md, open decisions).
 */
export const RANKS = [
  { id: 'tiro', name: 'Tiro', meaning: 'Recruit', minDays: 1 },
  { id: 'miles', name: 'Miles', meaning: 'Soldier', minDays: 4 },
  { id: 'optio', name: 'Optio', meaning: 'Second-in-command', minDays: 10 },
  { id: 'centurion', name: 'Centurion', meaning: 'Commander of a century', minDays: 20 },
  { id: 'tribune', name: 'Tribune', meaning: 'Senior officer', minDays: 35 },
  { id: 'legate', name: 'Legate', meaning: 'Commander of a legion', minDays: 50 },
  { id: 'consul', name: 'Consul', meaning: 'The highest elected office', minDays: 60 },
] as const;

/** Caesar is not reached by days: it is reserved for finishing a full 90-day arc. */
export const CAESAR = { id: 'caesar', name: 'Caesar', meaning: 'Finished a 90-day arc' } as const;
export const CAESAR_ARC_LENGTH = 90;

export type Rank = { id: string; name: string; meaning: string };

export type RankStatus = {
  /** Null before the first completed day. */
  current: Rank | null;
  /** The next rank, or null at the top. */
  next: Rank | null;
  /** Completed days still needed for the next rank. 0 at the top. */
  daysToNext: number;
  /** 0 to 1 through the current rank band. */
  progress: number;
};

/** The rank for a number of completed days. Finishing a 90-day arc makes Caesar. */
export function getRankStatus(completedDays: number, hasFinishedCaesarArc: boolean): RankStatus {
  const days = Number.isFinite(completedDays) ? Math.max(0, Math.floor(completedDays)) : 0;
  if (hasFinishedCaesarArc) return { current: CAESAR, next: null, daysToNext: 0, progress: 1 };

  let currentIndex = -1;
  RANKS.forEach((rank, index) => {
    if (days >= rank.minDays) currentIndex = index;
  });
  const current = currentIndex >= 0 ? RANKS[currentIndex] : undefined;
  const next = RANKS[currentIndex + 1];

  if (!next) return { current: current ?? null, next: null, daysToNext: 0, progress: 1 };
  const bandStart = current?.minDays ?? 0;
  const progress = (days - bandStart) / (next.minDays - bandStart);
  return {
    current: current ?? null,
    next,
    daysToNext: next.minDays - days,
    progress: Math.min(1, Math.max(0, progress)),
  };
}
