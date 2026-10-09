import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import {
  db,
  selectDayLogsBetween,
  selectLedger,
  selectOrderLogsBetween,
  toDayRecords,
  toOrderAmounts,
} from '@/db';
import { getArcPosition } from '@/features/arc';
import {
  CAESAR_ARC_LENGTH,
  countCompletedDays,
  type DayRecord,
  getBestCampaign,
  getCurrentCampaign,
  getRankStatus,
  isTruceAvailable,
  type RankStatus,
} from '@/features/campaign';
import { areAllOrdersConquered, areAllOrdersHeld, type OrderTargets } from '@/features/orders';
import type { DayKey } from '@/lib/dates';

/** Far-future day used to query nothing when there is no arc. */
const NO_ARC_DAY = '9999-12-31';

export type Campaign = {
  /** Sealed days of the arc, oldest first. */
  records: DayRecord[];
  campaign: number;
  bestCampaign: number;
  completedDays: number;
  rank: RankStatus;
  isTruceAvailable: boolean;
  denarii: number;
  /** Today so far: open until all four orders hold. */
  todayStatus: 'open' | 'held' | 'conquered';
  /** Days of the arc with a saved selfie, today included. */
  selfieDays: number;
  isLoaded: boolean;
};

type ArcInfo = { startDay: DayKey; lengthDays: number } | null;

/** The campaign so far, computed live from the arc's rows. Sealing itself runs in useSealFinishedDays. */
export function useCampaign(arc: ArcInfo, targets: OrderTargets, today: DayKey): Campaign {
  const from = arc?.startDay ?? NO_ARC_DAY;
  const dayRows = useLiveQuery(selectDayLogsBetween(db, from, today), [from, today]);
  const orderRows = useLiveQuery(selectOrderLogsBetween(db, from, today), [from, today]);
  const ledgerRows = useLiveQuery(selectLedger(db));

  const records = toDayRecords(dayRows.data, orderRows.data, targets).sort((a, b) =>
    a.day.localeCompare(b.day),
  );
  const todayAmounts = toOrderAmounts(orderRows.data.filter((row) => row.day === today));
  const isTodayHeld = arc != null && areAllOrdersHeld(todayAmounts, targets);
  const truceDays = dayRows.data.filter((row) => row.truceUsed).map((row) => row.day);
  const completedDays = countCompletedDays(records, isTodayHeld);
  const hasFinishedCaesarArc =
    arc != null &&
    arc.lengthDays >= CAESAR_ARC_LENGTH &&
    getArcPosition(arc.startDay, arc.lengthDays, today).phase === 'finished';

  return {
    records,
    campaign: getCurrentCampaign(records, today, isTodayHeld),
    bestCampaign: getBestCampaign(records, today, isTodayHeld),
    completedDays,
    rank: getRankStatus(completedDays, hasFinishedCaesarArc),
    isTruceAvailable: isTruceAvailable(truceDays, today),
    todayStatus: !isTodayHeld ? 'open' : areAllOrdersConquered(todayAmounts, targets) ? 'conquered' : 'held',
    selfieDays: dayRows.data.filter((row) => row.selfiePath).length,
    denarii: ledgerRows.data.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
    isLoaded:
      dayRows.updatedAt !== undefined &&
      orderRows.updatedAt !== undefined &&
      ledgerRows.updatedAt !== undefined,
  };
}
