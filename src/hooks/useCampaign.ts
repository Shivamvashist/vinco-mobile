import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import {
  db,
  selectCustomOrderLogsBetween,
  selectCustomOrdersOn,
  selectDayLogsBetween,
  selectLedger,
  selectOrderLogsBetween,
  selectTruces,
  toCustomAmounts,
  toCustomOrder,
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
  getDayResult,
  getRankStatus,
  getTruceOffer,
  type RankStatus,
  type TruceOffer,
} from '@/features/campaign';
import { getCustomOrderStatus, type OrderTargets } from '@/features/orders';
import type { DayKey } from '@/lib/dates';

/** Far-future day used to query nothing when there is no arc. */
const NO_ARC_DAY = '9999-12-31';
/** Never matches a real arc. */
const NO_ARC_ID = -1;

export type Campaign = {
  /** Sealed days of the arc, oldest first. */
  records: DayRecord[];
  campaign: number;
  bestCampaign: number;
  completedDays: number;
  rank: RankStatus;
  /** Truces held in reserve. */
  truceReserve: number;
  /** What a Truce would save and cost right now, or null when there is nothing to save. */
  truceOffer: TruceOffer | null;
  /** Denarii held: earned minus spent. */
  denarii: number;
  /** Today so far: open until all four orders hold. */
  todayStatus: 'open' | 'held' | 'conquered';
  /** Days of the arc with a saved selfie, today included. */
  selfieDays: number;
  isLoaded: boolean;
};

type ArcInfo = { id: number; startDay: DayKey; lengthDays: number } | null;

/** The campaign so far, computed live from the arc's rows. Sealing itself runs in useSealFinishedDays. */
export function useCampaign(arc: ArcInfo, targets: OrderTargets, today: DayKey): Campaign {
  const from = arc?.startDay ?? NO_ARC_DAY;
  const dayRows = useLiveQuery(selectDayLogsBetween(db, from, today), [from, today]);
  const orderRows = useLiveQuery(selectOrderLogsBetween(db, from, today), [from, today]);
  const ledgerRows = useLiveQuery(selectLedger(db));
  const truceRows = useLiveQuery(selectTruces(db));
  const customRows = useLiveQuery(selectCustomOrdersOn(db, arc?.id ?? NO_ARC_ID, today), [arc?.id, today]);
  const customLogs = useLiveQuery(selectCustomOrderLogsBetween(db, today, today), [today]);

  const records = toDayRecords(dayRows.data, orderRows.data, targets).sort((a, b) =>
    a.day.localeCompare(b.day),
  );
  const todayAmounts = toOrderAmounts(orderRows.data.filter((row) => row.day === today));
  const customAmounts = toCustomAmounts(customLogs.data, today);
  const customStatuses = customRows.data.map((row) =>
    getCustomOrderStatus(customAmounts.get(row.id) ?? 0, toCustomOrder(row)),
  );
  const todayResult = getDayResult(todayAmounts, targets, false, customStatuses);
  const isTodayHeld = arc != null && todayResult !== 'missed';
  const sumAmounts = (rows: readonly { amount: number }[]) =>
    rows.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0);
  const denarii = sumAmounts(ledgerRows.data);
  const truceReserve = Math.max(0, sumAmounts(truceRows.data));
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
    truceReserve,
    truceOffer: arc ? getTruceOffer(records, today, truceReserve, denarii) : null,
    todayStatus: !isTodayHeld ? 'open' : todayResult === 'conquered' ? 'conquered' : 'held',
    selfieDays: dayRows.data.filter((row) => row.selfiePath).length,
    denarii,
    isLoaded:
      dayRows.updatedAt !== undefined &&
      orderRows.updatedAt !== undefined &&
      ledgerRows.updatedAt !== undefined &&
      truceRows.updatedAt !== undefined &&
      customRows.updatedAt !== undefined &&
      customLogs.updatedAt !== undefined,
  };
}
