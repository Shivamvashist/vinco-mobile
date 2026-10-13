import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, selectAllArcs, selectSealedResults } from '@/db';
import { type PastArc, summarizePastArcs } from '@/features/arc';

/** Every arc before the current one, newest first, with what was done in each. Live. */
export function useArcHistory(): PastArc[] {
  const arcRows = useLiveQuery(selectAllArcs(db));
  const resultRows = useLiveQuery(selectSealedResults(db));
  return summarizePastArcs(arcRows.data, resultRows.data);
}
