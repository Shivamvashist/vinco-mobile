/** Drawing helpers for the card designs: points on circles, laurel leaves, sun rays. Pure. */

export type Point = { x: number; y: number };

const round = (value: number) => Math.round(value * 100) / 100;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** A point on a circle. 0 degrees is right, 90 is down (screen coordinates). */
export function polar(cx: number, cy: number, r: number, degrees: number): Point {
  const a = toRadians(degrees);
  return { x: round(cx + r * Math.cos(a)), y: round(cy + r * Math.sin(a)) };
}

/** An almond leaf from its base, pointing along a direction (degrees), as an SVG path. */
export function leafPath(base: Point, degrees: number, length: number, width: number): string {
  const a = toRadians(degrees);
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const tip = { x: round(base.x + ux * length), y: round(base.y + uy * length) };
  const mid = { x: base.x + (ux * length) / 2, y: base.y + (uy * length) / 2 };
  const side1 = { x: round(mid.x - uy * width), y: round(mid.y + ux * width) };
  const side2 = { x: round(mid.x + uy * width), y: round(mid.y - ux * width) };
  return `M${base.x} ${base.y} Q${side1.x} ${side1.y} ${tip.x} ${tip.y} Q${side2.x} ${side2.y} ${base.x} ${base.y}Z`;
}

export type Wreath = { stems: string[]; leaves: string[] };

/**
 * A full laurel wreath: two branches rising from the bottom of a circle and nearly meeting at the
 * top, each with pairs of leaves (one outside, one inside) that shrink toward the tips.
 */
export function wreath(cx: number, cy: number, r: number, leafLength = 22): Wreath {
  const start = 100;
  const end = 246;
  const step = 13;
  const stems = [
    `M${pointText(polar(cx, cy, r, start))} A${r} ${r} 0 0 1 ${pointText(polar(cx, cy, r, end))}`,
    `M${pointText(polar(cx, cy, r, 180 - start))} A${r} ${r} 0 0 0 ${pointText(polar(cx, cy, r, 180 - end))}`,
  ];
  const leaves: string[] = [];
  for (let angle = start + 4; angle <= end; angle += step) {
    const t = (angle - start) / (end - start);
    const length = leafLength * (1 - 0.38 * t);
    const width = length * 0.24;
    // Left branch grows clockwise: its heading is the angle plus 90. Leaves splay 38 degrees off it.
    const left = polar(cx, cy, r, angle);
    leaves.push(
      leafPath(left, angle + 90 - 38, length, width),
      leafPath(left, angle + 90 + 38, length, width),
    );
    // The right branch mirrors it across the vertical.
    const mirrored = 180 - angle;
    const right = polar(cx, cy, r, mirrored);
    leaves.push(
      leafPath(right, mirrored - 90 + 38, length, width),
      leafPath(right, mirrored - 90 - 38, length, width),
    );
  }
  // A last leaf along each tip.
  leaves.push(
    leafPath(polar(cx, cy, r, end), end + 90, leafLength * 0.55, leafLength * 0.13),
    leafPath(polar(cx, cy, r, 180 - end), 180 - end - 90, leafLength * 0.55, leafLength * 0.13),
  );
  return { stems, leaves };
}

/** Angles for n marks spread evenly around a centre angle, `gap` degrees apart. */
export function spreadAngles(count: number, centre: number, gap: number): number[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) =>
    round(centre + (index - (count - 1) / 2) * gap),
  );
}

/** Angles for n rays fanned across the upper half, kept clear of the horizon at both ends. */
export function rayAngles(count: number, margin = 14): number[] {
  if (count <= 0) return [];
  if (count === 1) return [270];
  const from = 180 + margin;
  const span = 180 - margin * 2;
  return Array.from({ length: count }, (_, index) => round(from + (span * index) / (count - 1)));
}

function pointText(point: Point): string {
  return `${point.x} ${point.y}`;
}
