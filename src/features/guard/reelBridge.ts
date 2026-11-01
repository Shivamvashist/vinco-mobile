import type { VigilNativeReelConfig } from '../../../modules/vigil';

import { clampReelBudget, type GuardLevel, isGuardLevel } from './guard';
import { clampReelPasses, REEL_PASS } from './reelPass';
import { toReelCount } from './reels';

/**
 * The words on the reel overlays (src/copy/guard.ts `reels.overlay`), with "{count}" and
 * "{budget}" filled in on the phone. Missing ones keep the native defaults.
 */
export type ReelOverlayCopy = {
  /** The badge: "{count} reels". */
  badge: string;
  /** The badge at one reel. */
  badgeOne: string;
  /** What a screen reader says for the badge. */
  badgeLabel: string;
  budgetTitle: string;
  budgetBody: string;
  milestoneTitle: string;
  milestoneBody: string;
  close: string;
  /** The panel a tap on the badge opens: its eyebrow, the count line, and the passes used. */
  panelTitle: string;
  panelCount: string;
  panelPasses: string;
  /** The pass button: "Reel pass +{reels}", then its price "{price} denarii". */
  passAction: string;
  passPrice: string;
  /** Instead of the button when the day's three passes are used. */
  passesUsed: string;
  /** Instead of the button when the denarii fall short. */
  passShort: string;
  /** The blocking card past the allowance: title, the tone's line, and its actions. */
  blockTitle: string;
  blockBody: string;
  leave: string;
  /** What a screen reader says for the badge's tap. */
  badgeHint: string;
};

/** The overlay colours, "#RRGGBB", from the active theme. Missing ones keep Basalt. */
export type ReelOverlayColors = {
  surface: string;
  border: string;
  text: string;
  muted: string;
  /** Near the budget, and the card's button. */
  near: string;
  onNear: string;
  /** Past the budget. */
  over: string;
};

/** What `configure` takes: the reel watch's settings. */
export type ReelWatchConfig = {
  level: GuardLevel;
  reelBudget: number;
  markedPackages: readonly string[];
  /**
   * The reel day the passes belong to (the phone's own date, yyyy-MM-dd, the day the native counter
   * counts into; never the dev clock). The phone applies them only on that day, so midnight resets.
   */
  passDay?: string;
  /** Reel passes used on `passDay` (0 to 3). */
  passes?: number;
  /** Denarii held now: the overlays offer a pass only when it is affordable. */
  denarii?: number;
  copy?: Partial<ReelOverlayCopy>;
  colors?: Partial<ReelOverlayColors>;
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** The config as the Kotlin side takes it: a known level, the budget in range, clean lists. */
export function toNativeReelConfig(config: ReelWatchConfig): VigilNativeReelConfig {
  const packages = config.markedPackages.map((name) => name.trim()).filter((name) => name.length > 0);
  const copy: Record<string, string> = {};
  for (const [key, value] of Object.entries(config.copy ?? {})) {
    if (typeof value === 'string' && value.trim().length > 0) copy[key] = value;
  }
  const colors: Record<string, string> = {};
  for (const [key, value] of Object.entries(config.colors ?? {})) {
    if (typeof value === 'string' && HEX_COLOR.test(value)) colors[key] = value;
  }
  return {
    level: isGuardLevel(config.level) ? config.level : 'pax',
    reelBudget: clampReelBudget(config.reelBudget),
    markedPackages: [...new Set(packages)],
    passDay: typeof config.passDay === 'string' && DAY_KEY.test(config.passDay) ? config.passDay : '',
    passes: clampReelPasses(config.passes),
    denarii: Math.max(0, toReelCount(config.denarii) ?? 0),
    passPrice: REEL_PASS.price,
    passReels: REEL_PASS.reels,
    passMax: REEL_PASS.maxPerDay,
    copy,
    colors,
  };
}

/** The count from a native `onReel` event, or null for anything malformed. */
export function toReelEventCount(raw: unknown): number | null {
  if (typeof raw !== 'object' || raw === null) return null;
  return toReelCount((raw as { count?: unknown }).count);
}
