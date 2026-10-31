import { arcEndDay, getArcPosition } from '@/features/arc';
import { type Decoration, type DecorationId, getDecorations } from '@/features/campaign';
import { buildJourneyDays } from '@/features/gloria';
import { weekStartOf } from '@/features/logs';
import {
  type ClaimCheck,
  type ClaimKind,
  type ClaimPay,
  claimKey,
  claimReason,
  checkLabourClaim,
  DECORATION_REWARDS,
  FOREVER_PERIOD,
  getLabourBoard,
  type LabourId,
  type Reward,
  resolveClaimPay,
  toLabourFacts,
} from '@/features/labours';
import { type DayKey, dayOfArc } from '@/lib/dates';

import { getActiveArc, selectArcOrders, toOrderTargets } from './arcs';
import { type AppDatabase, nowIso } from './database';
import { getDayStanding } from './dayStanding';
import { loadJourneyInput, selectClaims } from './journey';
import { claims, ledger, truces } from './schema';
import { selectDayLogsBetween, selectOrderLogsBetween, toDayRecords } from './sealing';
import { getTruceReserve } from './truces';

/** Why a claim was refused. */
export class ClaimError extends Error {
  readonly reason: Exclude<ClaimCheck, 'ok'>;

  constructor(reason: Exclude<ClaimCheck, 'ok'>) {
    super(`Claim refused: ${reason}`);
    this.name = 'ClaimError';
    this.reason = reason;
  }
}

/** The set of claim keys made so far (claimKey), for the boards. */
export function toClaimedKeys(
  rows: readonly { kind: ClaimKind; key: string; period: string }[],
): Set<string> {
  return new Set(rows.map((row) => claimKey(row.kind, row.key, row.period)));
}

/**
 * Claims a labour for its current period, in one transaction: checks the progress again from
 * fresh rows (a labour undone since, or a period that has passed, is refused), then writes the
 * claim, its denarii (ledger) and any Truce. Throws ClaimError when refused. Returns what it paid.
 */
export function claimLabour(db: AppDatabase, id: LabourId, today: DayKey, now: Date = new Date()): ClaimPay {
  return db.transaction((tx) => {
    const weekStart = weekStartOf(today);
    const days = buildJourneyDays(loadJourneyInput(tx, weekStart, today), weekStart, today);
    const claimed = toClaimedKeys(selectClaims(tx).all());
    const status = getLabourBoard(toLabourFacts(days, today), claimed, today).find(
      (item) => item.labour.id === id,
    );
    const check = checkLabourClaim(status);
    if (check !== 'ok' || !status) throw new ClaimError(check === 'ok' ? 'unavailable' : check);
    return writeClaim(tx, 'labour', id, status.period, status.labour.reward, today, now);
  });
}

/**
 * Claims an earned decoration, once forever, in one transaction: checks again that it is earned
 * on the active arc right now. Throws ClaimError when refused. Returns what it paid.
 */
export function claimDecoration(
  db: AppDatabase,
  id: DecorationId,
  today: DayKey,
  now: Date = new Date(),
): ClaimPay {
  return db.transaction((tx) => {
    const claimed = toClaimedKeys(selectClaims(tx).all());
    if (claimed.has(claimKey('decoration', id, FOREVER_PERIOD))) throw new ClaimError('claimed');
    const decoration = getDecorationsNow(tx, today).find((item) => item.id === id);
    if (!decoration?.isEarned) throw new ClaimError('incomplete');
    return writeClaim(tx, 'decoration', id, FOREVER_PERIOD, DECORATION_REWARDS[id], today, now);
  });
}

/** The active arc's decorations as they stand now (the same rules Vici shows). */
export function getDecorationsNow(db: AppDatabase, today: DayKey): Decoration[] {
  const arc = getActiveArc(db);
  if (!arc) return [];
  const isLudus = arc.kind === 'ludus';
  const targets = toOrderTargets(selectArcOrders(db, arc.id).all(), arc.kind);
  const dayRows = selectDayLogsBetween(db, arc.startDay, today).all();
  const records = toDayRecords(dayRows, selectOrderLogsBetween(db, arc.startDay, today).all(), targets);
  const isInArc = today >= arc.startDay && today <= arcEndDay(arc.startDay, arc.lengthDays);
  const standing = isInArc ? getDayStanding(db, arc.id, today, targets) : 'missed';
  const position = getArcPosition(arc.startDay, arc.lengthDays, today);
  const dayNumber = isLudus
    ? Math.max(1, dayOfArc(arc.startDay, today))
    : position.phase === 'active'
      ? position.dayNumber
      : position.phase === 'finished'
        ? arc.lengthDays
        : 1;
  return getDecorations({
    records,
    today,
    todayStatus: standing === 'missed' ? 'open' : standing,
    dayNumber,
    lengthDays: isLudus ? null : arc.lengthDays,
    selfieDays: dayRows.filter((row) => row.selfiePath).length,
    hasOath: arc.oathPath != null,
  });
}

/** Writes a claim and what it pays. The unique index refuses a second claim for one period. */
function writeClaim(
  tx: AppDatabase,
  kind: ClaimKind,
  key: string,
  period: string,
  reward: Reward,
  today: DayKey,
  now: Date,
): ClaimPay {
  const pay = resolveClaimPay(reward, getTruceReserve(tx));
  const createdAt = nowIso(now);
  const inserted = tx
    .insert(claims)
    .values({
      kind,
      key,
      period,
      day: today,
      denarii: pay.denarii,
      gloria: pay.gloria,
      truces: pay.truces,
      claimedAt: createdAt,
    })
    .onConflictDoNothing()
    .returning({ id: claims.id })
    .all();
  if (inserted.length === 0) throw new ClaimError('claimed');
  // A plain insert: a clash would roll the whole claim back rather than pay nothing.
  if (pay.denarii > 0) {
    tx.insert(ledger)
      .values({ day: today, reason: claimReason(kind, key), amount: pay.denarii, createdAt })
      .run();
  }
  if (pay.truces > 0) {
    tx.insert(truces)
      .values({ day: today, reason: `claim_${kind}_${key}`, amount: pay.truces, createdAt })
      .run();
  }
  return pay;
}
