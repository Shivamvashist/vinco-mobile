import { cornerCut, notchedTilePath } from '../notchedTile';

const shape = { width: 160, height: 140, cornerRadius: 20, buttonSize: 44, gap: 6, filletRadius: 8 };

/** The numbers after the first occurrence of a path command prefix. */
function pointAfter(path: string, prefix: string): [number, number] {
  const rest = path
    .slice(path.indexOf(prefix) + prefix.length)
    .trim()
    .split(' ');
  return [Number(rest[0]), Number(rest[1])];
}

describe('cornerCut', () => {
  it('wraps the button with the gap: the inner arc shares the button centre', () => {
    const { size, innerRadius } = cornerCut(44, 6);
    expect(size).toBe(50);
    expect(innerRadius).toBe(28);
    // Button centre, flush with the corner, is buttonSize / 2 in from both edges.
    const centreFromCut = size - 44 / 2;
    expect(innerRadius - centreFromCut).toBe(0);
  });
});

describe('notchedTilePath', () => {
  it('draws a closed outline with one concave arc and two fillets', () => {
    const path = notchedTilePath(shape);
    expect(path.startsWith('M 20 0')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(path.match(/A 28 28 0 0 0/g)).toHaveLength(1);
    expect(path.match(/A 8 8 0 0 1/g)).toHaveLength(2);
  });

  it('keeps an even gap: both ends of the inner arc are buttonRadius + gap from the button centre', () => {
    const path = notchedTilePath(shape);
    const centre = { x: 160 - 22, y: 140 - 22 };
    const arcEnd = pointAfter(path, 'A 28 28 0 0 0');
    expect(Math.hypot(arcEnd[0] - centre.x, arcEnd[1] - centre.y)).toBeCloseTo(28, 6);
    // The arc starts on the cut's top edge, inner radius right of the cut's left side.
    expect(path).toContain(`H ${160 - 50 + 28}`);
  });

  it('caps the fillets to the straight run of the cut', () => {
    const path = notchedTilePath({ ...shape, filletRadius: 40 });
    // size 50 minus inner 28 leaves 22.
    expect(path.match(/A 22 22 0 0 1/g)).toHaveLength(2);
  });

  it('is empty before layout or when the tile is too small for the cut', () => {
    expect(notchedTilePath({ ...shape, width: 0 })).toBe('');
    expect(notchedTilePath({ ...shape, width: 70, height: 70 })).toBe('');
  });
});
