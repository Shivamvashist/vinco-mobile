import { notchedTilePath, notchRadiusFor } from '../notchedTile';

const shape = { width: 160, height: 140, cornerRadius: 20, notchRadius: 54, filletRadius: 8 };

describe('notchedTilePath', () => {
  it('draws a closed outline with the bite at the bottom-right corner', () => {
    const path = notchedTilePath(shape);
    expect(path.startsWith('M 20 0')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    // Two fillets (sweep 1) around one concave bite (sweep 0).
    expect(path).toContain('A 54 54 0 0 0');
    expect(path.match(/A 8 8 0 0 1/g)).toHaveLength(2);
  });

  it('meets the edges where the fillets touch them', () => {
    const reach = Math.sqrt((54 + 8) ** 2 - 8 ** 2);
    const path = notchedTilePath(shape);
    expect(path).toContain(`V ${140 - reach}`);
    expect(path).toContain(`${160 - reach} 140`);
  });

  it('keeps the bite touch points on the bite circle', () => {
    // The concave arc's end point follows "A 54 54 0 0 0".
    const path = notchedTilePath(shape);
    const after = path.slice(path.indexOf('A 54 54 0 0 0') + 'A 54 54 0 0 0 '.length).split(' ');
    const x = Number(after[0]);
    const y = Number(after[1]);
    expect(Math.hypot(160 - x, 140 - y)).toBeCloseTo(54, 6);
  });

  it('is empty before layout or when the tile is too small for the bite', () => {
    expect(notchedTilePath({ ...shape, width: 0 })).toBe('');
    expect(notchedTilePath({ ...shape, width: 60, height: 60 })).toBe('');
  });
});

describe('notchRadiusFor', () => {
  it('leaves an even gap round a button flush with the corner edges', () => {
    const buttonRadius = 20;
    const gap = 6;
    const notch = notchRadiusFor(buttonRadius, gap);
    // The button's centre sits buttonRadius in from both edges.
    const centreFromCorner = Math.hypot(buttonRadius, buttonRadius);
    expect(notch - (centreFromCorner + buttonRadius)).toBeCloseTo(gap, 6);
  });
});
