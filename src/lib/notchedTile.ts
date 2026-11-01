/**
 * The outline of a tile with a socket cut out of its bottom-right corner for a round button, as
 * an SVG path. The button sits flush with the tile's right and bottom edges; the cut wraps it with
 * an even gap: its inner corner is an arc sharing the button's centre, and small rounded fillets
 * join the cut to the tile's edges, so it reads as one shape carved round the button.
 */
export type NotchedTileShape = {
  width: number;
  height: number;
  /** The tile's own corner radius (the other three corners). */
  cornerRadius: number;
  /** The button's diameter. */
  buttonSize: number;
  /** The even gap between the button and the cut. */
  gap: number;
  /** The fillets where the cut meets the right and bottom edges. */
  filletRadius: number;
};

/** The square the cut takes out of the corner, and the radius of its inner, concentric arc. */
export function cornerCut(buttonSize: number, gap: number): { size: number; innerRadius: number } {
  return { size: buttonSize + gap, innerRadius: buttonSize / 2 + gap };
}

/** An empty path when the tile is too small to hold its corners and the cut (before layout). */
export function notchedTilePath({
  width: w,
  height: h,
  cornerRadius: r,
  buttonSize,
  gap,
  filletRadius,
}: NotchedTileShape): string {
  const { size: s, innerRadius: inner } = cornerCut(buttonSize, gap);
  // The fillets can't be longer than the straight run between them and the inner arc.
  const f = Math.max(0, Math.min(filletRadius, s - inner));
  if (w <= 0 || h <= 0 || s + f + r > w || s + f + r > h) return '';
  const cutX = w - s;
  const cutY = h - s;

  return [
    `M ${r} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    // Down the right edge, then a fillet into the top of the cut.
    `V ${cutY - f}`,
    `A ${f} ${f} 0 0 1 ${w - f} ${cutY}`,
    // Along the cut's top, round the inner arc (concentric with the button), down its left side.
    `H ${cutX + inner}`,
    `A ${inner} ${inner} 0 0 0 ${cutX} ${cutY + inner}`,
    `V ${h - f}`,
    `A ${f} ${f} 0 0 1 ${cutX - f} ${h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');
}
