/**
 * The reward flight: one engine, one registry of counter positions. A claim writes its rows first,
 * then calls launchRewardFlight; the glyphs are only the show, so a killed app never loses or
 * doubles pay. Each HUD counter registers how to find itself on screen; while a flight of its kind
 * is in the air, the counter shows the value from before the claim plus what has landed so far,
 * then settles on the real total. No layer (reduce motion), or no counter on screen: no flight.
 */
import { useSyncExternalStore } from 'react';
import type { View } from 'react-native';

export type RewardKind = 'denarii' | 'gloria' | 'truces';

/** In HUD order. */
export const REWARD_KINDS: readonly RewardKind[] = ['denarii', 'gloria', 'truces'];

/** A point in window coordinates (measureInWindow). */
export type FlightPoint = { x: number; y: number };

export type RewardAmounts = Partial<Record<RewardKind, number>>;

export type RewardFlightRequest = {
  from: FlightPoint;
  rewards: RewardAmounts;
  /**
   * The rewards were already in the records before this claim (a focus pays when it completes;
   * its Claim is only the show), so the counters count up from their total minus the reward.
   */
  isAlreadyCounted?: boolean;
};

/** One kind's glyphs in the air. `to` is null until its counter has been measured. */
export type FlightGroup = {
  id: number;
  kind: RewardKind;
  from: FlightPoint;
  to: FlightPoint | null;
  amount: number;
  glyphs: number;
  landed: number;
};

type FlightState = {
  groups: readonly FlightGroup[];
  /** What each counter showed when its first group took off. */
  baseline: Readonly<Partial<Record<RewardKind, number>>>;
};

/** Finds a counter's centre on screen; calls back with null when it can't be measured. */
export type CounterMeasure = (done: (point: FlightPoint | null) => void) => void;

/** A flight never holds a counter longer than this, even if its glyphs never land (app hidden). */
const MAX_FLIGHT_MS = 3500;
/** Landings make a sound and a haptic at most this often, across every flight. */
const LANDING_CUE_GAP_MS = 90;
/** Within a group, only the first landing, every 4th and the last give a cue. */
const LANDING_CUE_EVERY = 4;

let state: FlightState = { groups: [], baseline: {} };
let nextId = 1;
let isLayerReady = false;
const listeners = new Set<() => void>();
const counters: Partial<Record<RewardKind, { token: number; measure: CounterMeasure }>> = {};
const lastShown: Partial<Record<RewardKind, number>> = {};
let lastLandingCueAt = Number.NEGATIVE_INFINITY;

/**
 * Shows a claim's rewards flying from where it was claimed to their counters. Call after the
 * claim is written. Kinds with nothing to pay, or without a counter on screen, are skipped.
 */
export function launchRewardFlight({ from, rewards, isAlreadyCounted = false }: RewardFlightRequest): void {
  if (!isLayerReady || !Number.isFinite(from.x) || !Number.isFinite(from.y)) return;
  for (const kind of REWARD_KINDS) {
    const amount = Math.floor(rewards[kind] ?? 0);
    const counter = counters[kind];
    if (amount <= 0 || !counter) continue;
    const id = nextId++;
    const shown = lastShown[kind];
    const before = shown == null ? undefined : Math.max(0, shown - (isAlreadyCounted ? amount : 0));
    const baseline = state.baseline[kind] ?? before;
    setState({
      groups: [
        ...state.groups,
        { id, kind, from, to: null, amount, glyphs: glyphCount(kind, amount), landed: 0 },
      ],
      baseline: baseline == null ? state.baseline : { ...state.baseline, [kind]: baseline },
    });
    counter.measure((to) => {
      if (to) updateGroup(id, (group) => ({ ...group, to }));
      else removeGroup(id);
    });
    setTimeout(() => removeGroup(id), MAX_FLIGHT_MS);
  }
}

/** The centre of a view on screen, for a flight's start or a counter. Null when not laid out. */
export function measureCentre(view: View | null, done: (point: FlightPoint | null) => void): void {
  if (!view) {
    done(null);
    return;
  }
  view.measureInWindow((x, y, width, height) => {
    const isMeasured = [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0;
    done(isMeasured ? { x: x + width / 2, y: y + height / 2 } : null);
  });
}

/** Denarii only: the purse's coin flight. A thin wrapper over launchRewardFlight. */
export function launchCoinFlight({ from, amount }: { from: FlightPoint; amount: number }): void {
  launchRewardFlight({ from, rewards: { denarii: amount } });
}

/** How many glyphs fly for an amount: a few coins or sparks, one shield per Truce. */
export function glyphCount(kind: RewardKind, amount: number): number {
  const value = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  if (value === 0) return 0;
  if (kind === 'truces') return Math.min(3, value);
  if (kind === 'gloria') return Math.min(8, Math.max(4, Math.round(value / 25) + 3));
  return Math.min(10, Math.max(5, Math.round(value / 5) + 4));
}

/**
 * What a counter shows while its kind is in the air: the value before the claim plus what has
 * landed, never past the real total. With nothing in the air, the total.
 */
export function shownValue(flight: FlightState, kind: RewardKind, total: number): number {
  const groups = flight.groups.filter((group) => group.kind === kind);
  const baseline = flight.baseline[kind];
  if (groups.length === 0 || baseline == null) return total;
  const landed = groups.reduce(
    (sum, group) => sum + Math.round((group.amount * group.landed) / Math.max(1, group.glyphs)),
    0,
  );
  return Math.min(total, baseline + landed);
}

/** A counter puts itself on the map while its screen is in front. Returns the way off it. */
export function registerCounter(kind: RewardKind, measure: CounterMeasure): () => void {
  const token = nextId++;
  counters[kind] = { token, measure };
  return () => {
    if (counters[kind]?.token === token) delete counters[kind];
  };
}

/** A counter reports what it shows when nothing is in the air: the next flight starts from it. */
export function reportShown(kind: RewardKind, value: number): void {
  lastShown[kind] = value;
}

/** The layer is on screen (and motion allowed). Without it, nothing flies. */
export function setFlightLayerReady(isReady: boolean): void {
  isLayerReady = isReady;
  if (!isReady) setState({ groups: [], baseline: {} });
}

/** One glyph reached its counter. Returns which landing it was in its group, or null if gone. */
export function landGlyph(groupId: number): { index: number; glyphs: number } | null {
  const group = state.groups.find((item) => item.id === groupId);
  if (!group) return null;
  if (group.landed + 1 >= group.glyphs) removeGroup(groupId);
  else updateGroup(groupId, (item) => ({ ...item, landed: item.landed + 1 }));
  return { index: group.landed, glyphs: group.glyphs };
}

/**
 * Whether a landing gives its cue (sound and haptic): the first, every 4th and the last of a
 * group, and never closer than 90 ms to the last cue, so a 20-coin flight isn't 20 buzzes.
 */
export function shouldCueLanding(index: number, glyphs: number, now: number, lastCueAt: number): boolean {
  const isMarked = index === 0 || index === glyphs - 1 || index % LANDING_CUE_EVERY === 0;
  return isMarked && now - lastCueAt >= LANDING_CUE_GAP_MS;
}

/** shouldCueLanding against the last cue given; remembers this one when it sounds. */
export function claimLandingCue(index: number, glyphs: number, now: number): boolean {
  if (!shouldCueLanding(index, glyphs, now, lastLandingCueAt)) return false;
  lastLandingCueAt = now;
  return true;
}

/** Everything in the air is gone at once (the journey was reset): counters show their totals. */
export function clearRewardFlight(): void {
  setState({ groups: [], baseline: {} });
}

/** The flight, live. */
export function useRewardFlight(): FlightState {
  return useSyncExternalStore(subscribe, getRewardFlight, getRewardFlight);
}

/** The flight now, outside React. */
export function getRewardFlight(): FlightState {
  return state;
}

/** TESTS ONLY: back to an empty sky with no counters. */
export function resetRewardFlight(): void {
  state = { groups: [], baseline: {} };
  isLayerReady = false;
  lastLandingCueAt = Number.NEGATIVE_INFINITY;
  for (const kind of REWARD_KINDS) {
    delete counters[kind];
    delete lastShown[kind];
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(next: FlightState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function updateGroup(id: number, change: (group: FlightGroup) => FlightGroup): void {
  if (!state.groups.some((group) => group.id === id)) return;
  setState({ ...state, groups: state.groups.map((group) => (group.id === id ? change(group) : group)) });
}

function removeGroup(id: number): void {
  const removed = state.groups.find((group) => group.id === id);
  if (!removed) return;
  const groups = state.groups.filter((group) => group.id !== id);
  const isKindDone = !groups.some((group) => group.kind === removed.kind);
  const baseline = { ...state.baseline };
  if (isKindDone) delete baseline[removed.kind];
  setState({ groups, baseline });
}
