import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import {
  ClaimError,
  claimDecoration,
  claimLabour,
  db,
  selectClaims,
  selectTruces,
  toClaimedKeys,
} from '@/db';
import type { DecorationId } from '@/features/campaign';
import { weekStartOf } from '@/features/logs';
import {
  type ClaimCheck,
  type ClaimPay,
  getLabourBoard,
  type LabourId,
  type LabourStatus,
  toLabourFacts,
  topLabours,
} from '@/features/labours';
import type { DayKey } from '@/lib/dates';

import { useJourney } from './useJourney';
import { useToday } from './useToday';

/** What a claim did: what it paid, or why not ('failed' when saving broke). */
export type ClaimOutcome = { pay: ClaimPay } | { problem: Exclude<ClaimCheck, 'ok'> | 'failed' };

export type Labours = {
  today: DayKey;
  /** Every labour, in definition order (daily first). */
  board: LabourStatus[];
  /** Today's top three: claimable first, then the closest to done. */
  top: LabourStatus[];
  /** Claim keys made so far (claimKey), for decorations too. */
  claimed: ReadonlySet<string>;
  /** Truces held now: a Truce reward at the cap is paid as denarii (resolveClaimPay). */
  truceReserve: number;
  isLoaded: boolean;
  claim: (id: LabourId) => ClaimOutcome;
  claimDecoration: (id: DecorationId) => ClaimOutcome;
};

/** The Labours board for today and this week, live, with claiming (labours and decorations). */
export function useLabours(): Labours {
  const today = useToday();
  const journey = useJourney(weekStartOf(today), today);
  const claimRows = useLiveQuery(selectClaims(db));
  const truceRows = useLiveQuery(selectTruces(db));
  const truceReserve = Math.max(
    0,
    truceRows.data.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
  );
  const claimed = toClaimedKeys(claimRows.data);
  const board = getLabourBoard(toLabourFacts(journey.days, today), claimed, today);

  return {
    today,
    board,
    top: topLabours(board),
    claimed,
    truceReserve,
    isLoaded: journey.isLoaded && claimRows.updatedAt !== undefined && truceRows.updatedAt !== undefined,
    claim: (id) => runClaim(() => claimLabour(db, id, today)),
    claimDecoration: (id) => runClaim(() => claimDecoration(db, id, today)),
  };
}

function runClaim(write: () => ClaimPay): ClaimOutcome {
  try {
    return { pay: write() };
  } catch (error) {
    if (error instanceof ClaimError) return { problem: error.reason };
    if (__DEV__) console.warn('[claims] Could not claim.', error);
    return { problem: 'failed' };
  }
}
