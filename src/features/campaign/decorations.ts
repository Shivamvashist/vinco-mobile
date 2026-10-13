import { countsAsCompleted, type DayRecord, findResurgoDays, getBestCampaign } from './campaign';

/**
 * Decorations: honours for deeds, never bought. Computed from the arc's records, so they can
 * never disagree with them. The first set; the plan's full list (Aqueduct, Night watchman...)
 * follows when their data exists. See docs/v1-docs/PLAN.md, section 9.
 */
export type DecorationId =
  'firstSeal' | 'conqueror' | 'ironWeek' | 'resurgo' | 'halfway' | 'proofKeeper' | 'oathKeeper';

export const DECORATION_IDS: readonly DecorationId[] = [
  'firstSeal',
  'conqueror',
  'ironWeek',
  'resurgo',
  'halfway',
  'proofKeeper',
  'oathKeeper',
];

/** Thresholds, in one place to tune. */
export const DECORATION_RULES = {
  ironWeekCampaign: 7,
  proofKeeperSelfies: 7,
  oathKeeperDay: 10,
  /** In the Ludus there is no halfway: this many days trained earns it instead. */
  ludusHalfwayDays: 30,
} as const;

export type DecorationInput = {
  /** Sealed days of the arc, any order. */
  records: readonly DayRecord[];
  today: string;
  todayStatus: 'open' | 'held' | 'conquered';
  /** Day of the arc today (1-based). */
  dayNumber: number;
  /** Campaign length, or null in the Ludus. */
  lengthDays: number | null;
  selfieDays: number;
  hasOath: boolean;
};

export type Decoration = { id: DecorationId; isEarned: boolean };

/** Every decoration, earned or not, in display order. */
export function getDecorations(input: DecorationInput): Decoration[] {
  const isTodayDone = input.todayStatus !== 'open';
  const completed =
    input.records.filter((record) => countsAsCompleted(record.result)).length + (isTodayDone ? 1 : 0);
  const hasConquered =
    input.todayStatus === 'conquered' || input.records.some((record) => record.result === 'conquered');
  const best = getBestCampaign(input.records, input.today, isTodayDone);
  const halfwayMet =
    input.lengthDays == null
      ? completed >= DECORATION_RULES.ludusHalfwayDays
      : input.dayNumber > Math.floor(input.lengthDays / 2) && completed > 0;

  const earned: Record<DecorationId, boolean> = {
    firstSeal: completed > 0,
    conqueror: hasConquered,
    ironWeek: input.lengthDays != null && best >= DECORATION_RULES.ironWeekCampaign,
    resurgo: findResurgoDays(input.records).length > 0,
    halfway: halfwayMet,
    proofKeeper: input.selfieDays >= DECORATION_RULES.proofKeeperSelfies,
    oathKeeper: input.hasOath && input.dayNumber >= DECORATION_RULES.oathKeeperDay,
  };
  return DECORATION_IDS.map((id) => ({ id, isEarned: earned[id] }));
}
