/**
 * The outline of a tile with a round bite taken out of its bottom-right corner, as an SVG path.
 * The bite is a circle centred on the corner; small rounded fillets join it to the two edges, so
 * the cutout curves in smoothly instead of meeting the edges at a sharp angle.
 */
export type NotchedTileShape = {
  width: number;
  height: number;
  /** The tile's own corner radius (the other three corners). */
  cornerRadius: number;
  /** The bite's radius, measured from the bottom-right corner. */
  notchRadius: number;
  /** The fillets joining the bite to the bottom and right edges. */
  filletRadius: number;
};

/** An empty path when the tile is too small to hold its corners and the bite (before layout). */
export function notchedTilePath({
  width: w,
  height: h,
  cornerRadius: r,
  notchRadius: n,
  filletRadius: f,
}: NotchedTileShape): string {
  // Fillet centres sit f inside an edge and n + f from the corner: their distance along the edge.
  const reach = Math.sqrt((n + f) ** 2 - f ** 2);
  if (w <= 0 || h <= 0 || reach + r > w || reach + r > h) return '';
  const toBite = n / (n + f);
  // The fillet on the right edge, then the one on the bottom edge.
  const rightFillet = { x: w - f, y: h - reach };
  const bottomFillet = { x: w - reach, y: h - f };
  const rightTouch = { x: w + (rightFillet.x - w) * toBite, y: h + (rightFillet.y - h) * toBite };
  const bottomTouch = { x: w + (bottomFillet.x - w) * toBite, y: h + (bottomFillet.y - h) * toBite };

  return [
    `M ${r} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${rightFillet.y}`,
    `A ${f} ${f} 0 0 1 ${rightTouch.x} ${rightTouch.y}`,
    `A ${n} ${n} 0 0 0 ${bottomTouch.x} ${bottomTouch.y}`,
    `A ${f} ${f} 0 0 1 ${bottomFillet.x} ${h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');
}

/**
 * The bite that seats a round button of this radius in the corner with an even gap around it,
 * when the button sits flush with the tile's right and bottom edges.
 */
export function notchRadiusFor(buttonRadius: number, gap: number): number {
  return buttonRadius * (1 + Math.SQRT2) + gap;
}
