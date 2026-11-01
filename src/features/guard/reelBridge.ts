import type { VigilNativeReelConfig } from '../../../modules/vigil';

import { clampReelBudget, type GuardLevel, isGuardLevel } from './guard';
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
  copy?: Partial<ReelOverlayCopy>;
  colors?: Partial<ReelOverlayColors>;
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

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
    copy,
    colors,
  };
}

/** The count from a native `onReel` event, or null for anything malformed. */
export function toReelEventCount(raw: unknown): number | null {
  if (typeof raw !== 'object' || raw === null) return null;
  return toReelCount((raw as { count?: unknown }).count);
}
