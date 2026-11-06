/**
 * The day path's shape on Today: a quadratic arc that rises in the middle, like the sun's path,
 * sampled into points, plus the helpers that place things along it. Some run on the UI thread
 * ('worklet'), inside animated props.
 */

export type Point = { x: number; y: number };

/** A dot to draw: where, how big at full size, and when it pops in on a replay (ms). */
export type PathDot = { x: number; y: number; r: number; delay: number };

export const PATH_HEIGHT = 58;
export const PATH_PAD = 10;
const SAMPLES = 48;
/** Overshoot of the replay's pop (the classic "back out" curve). */
const BACK_OUT = 1.70158;

/** Points along the arc, left (the day's start) to right (midnight). */
export function sampleArc(width: number): Point[] {
  const start = { x: PATH_PAD, y: PATH_HEIGHT - PATH_PAD };
  const control = { x: width / 2, y: -PATH_HEIGHT * 0.35 };
  const end = { x: width - PATH_PAD, y: PATH_HEIGHT - PATH_PAD };
  return Array.from({ length: SAMPLES + 1 }, (_, index) => {
    const t = index / SAMPLES;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    return { x: a * start.x + b * control.x + c * end.x, y: a * start.y + b * control.y + c * end.y };
  });
}

/** The distance along the path at each sample. The last is the path's length. */
export function cumulativeLengths(points: readonly Point[]): number[] {
  const lengths: number[] = [];
  let total = 0;
  points.forEach((point, index) => {
    const previous = points[index - 1];
    if (previous) total += Math.hypot(point.x - previous.x, point.y - previous.y);
    lengths.push(total);
  });
  return lengths;
}

/**
 * The point at a distance along the path, between samples, so the dot and the solid line agree
 * and the dot glides while the line draws. Runs on the UI thread too.
 */
export function pointAlong(points: readonly Point[], lengths: readonly number[], distance: number): Point {
  'worklet';
  const fallback = { x: PATH_PAD, y: PATH_HEIGHT - PATH_PAD };
  let index = 0;
  while (index < lengths.length - 1 && (lengths[index] ?? 0) < distance) index += 1;
  const point = points[index];
  const previous = points[index - 1];
  const end = lengths[index];
  const start = lengths[index - 1];
  if (!point) return fallback;
  if (!previous || end == null || start == null || end <= start) return point;
  const share = Math.min(1, Math.max(0, (distance - start) / (end - start)));
  return { x: previous.x + (point.x - previous.x) * share, y: previous.y + (point.y - previous.y) * share };
}

/** SVG path data for the stretch of the path between two distances (a focus session). */
export function stretchPath(
  points: readonly Point[],
  lengths: readonly number[],
  from: number,
  to: number,
): string {
  const start = pointAlong(points, lengths, from);
  const inner = points.filter((_, index) => {
    const length = lengths[index] ?? 0;
    return length > from && length < to;
  });
  const end = pointAlong(points, lengths, Math.max(from, to));
  return [start, ...inner, end]
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${round(point.x)},${round(point.y)}`)
    .join(' ');
}

// Worklets that call each other are declared callee first: the worklet build turns each one into a
// const that captures its callees at that line, so a callee declared below is captured as undefined.

/** A pop that overshoots a little and settles, 0 at t = 0 and 1 from t = 1. Runs on the UI thread. */
export function popScale(t: number): number {
  'worklet';
  if (!(t > 0)) return 0;
  if (t >= 1) return 1;
  const u = t - 1;
  return 1 + (BACK_OUT + 1) * u * u * u + BACK_OUT * u * u;
}

/**
 * Many dots as one SVG path (two arcs each), so a day of marks is one element. `elapsed` is the
 * replay's clock: each dot pops in at its delay. Dots not yet in are left out. Runs on the UI thread.
 */
export function dotsPath(dots: readonly PathDot[], elapsed: number, popMs: number): string {
  'worklet';
  let data = '';
  // An index loop, never for...of: the build turns for...of into a helper function that doesn't
  // exist on the UI thread ("undefined is not a function", which closed the app on Today).
  for (let index = 0; index < dots.length; index += 1) {
    const dot = dots[index];
    if (!dot) continue;
    const scale = popScale((elapsed - dot.delay) / popMs);
    if (scale <= 0) continue;
    const r = Math.round(dot.r * scale * 100) / 100;
    const x = Math.round((dot.x - r) * 10) / 10;
    const y = Math.round(dot.y * 10) / 10;
    data += `M${x},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
  }
  // An empty path can upset some renderers: a point with no area draws nothing.
  return data === '' ? 'M0,0' : data;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
