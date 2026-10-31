import {
  availableDesigns,
  availableStyles,
  DAY_CARD_DESIGN_IDS,
  isDayCardDesignId,
  layoutNumeral,
  numeralWidth,
  pickAvailable,
  pickByDay,
  toCardResult,
} from '../designs';

const owned = { held: 1, boughtToday: 0 };

describe('day card designs', () => {
  it('keeps unique ids with classic first', () => {
    expect(new Set(DAY_CARD_DESIGN_IDS).size).toBe(DAY_CARD_DESIGN_IDS.length);
    expect(DAY_CARD_DESIGN_IDS[0]).toBe('classic');
    expect(isDayCardDesignId('sol')).toBe(true);
    expect(isDayCardDesignId('poster')).toBe(false);
    expect(isDayCardDesignId(3)).toBe(false);
  });

  it('shows Forum designs only once bought', () => {
    expect(availableDesigns({})).not.toContain('stamp');
    expect(availableDesigns({})).not.toContain('memento');
    expect(availableDesigns({ designStamp: owned })).toContain('stamp');
    expect(availableDesigns({ designStamp: { held: 0, boughtToday: 0 } })).not.toContain('stamp');
    expect(availableDesigns({})).toHaveLength(DAY_CARD_DESIGN_IDS.length - 2);
  });

  it('shows Forum colour styles only once bought', () => {
    const styles = [{ id: 'basalt' }, { id: 'nox', isFromForum: true }, { id: 'mystery', isFromForum: true }];
    expect(availableStyles(styles, {}).map((style) => style.id)).toEqual(['basalt']);
    expect(availableStyles(styles, { cardNox: owned }).map((style) => style.id)).toEqual(['basalt', 'nox']);
  });

  it('falls back when a saved choice is no longer available', () => {
    expect(pickAvailable('stamp', ['classic', 'sol'], 'classic')).toBe('classic');
    expect(pickAvailable('sol', ['classic', 'sol'], 'classic')).toBe('sol');
    expect(pickAvailable('sol', [], 'classic')).toBe('classic');
  });

  it('shows an open day as held, never conquered', () => {
    expect(toCardResult('open')).toBe('held');
    expect(toCardResult('held')).toBe('held');
    expect(toCardResult('conquered')).toBe('conquered');
  });

  it('picks a line by day, wrapping, and copes with odd input', () => {
    const lines = ['a', 'b', 'c'];
    expect(pickByDay(lines, 1)).toBe('a');
    expect(pickByDay(lines, 2)).toBe('b');
    expect(pickByDay(lines, 4)).toBe('a');
    expect(pickByDay(lines, 0)).toBe('a');
    expect(pickByDay(lines, Number.NaN)).toBe('a');
    expect(pickByDay([], 5)).toBeUndefined();
  });
});

describe('layoutNumeral', () => {
  const WIDTH = 210;

  it('keeps short numerals on one line', () => {
    expect(layoutNumeral(12, WIDTH).lines).toEqual(['XII']);
    expect(layoutNumeral(10, WIDTH).lines).toEqual(['X']);
    expect(layoutNumeral(5, WIDTH).lines).toEqual(['V']);
  });

  it('splits long numerals into tens over units when that sets them larger', () => {
    expect(layoutNumeral(38, WIDTH).lines).toEqual(['XXX', 'VIII']);
    expect(layoutNumeral(88, WIDTH).lines).toEqual(['LXXX', 'VIII']);
  });

  it('always fits the width', () => {
    for (const day of [1, 4, 9, 18, 27, 38, 49, 60, 88, 90, 138, 388]) {
      const { lines, fontSize } = layoutNumeral(day, WIDTH, 0.04);
      for (const line of lines) expect(numeralWidth(line, 0.04) * fontSize).toBeLessThanOrEqual(WIDTH);
      expect(fontSize).toBeGreaterThan(20);
    }
  });

  it('copes with days out of range', () => {
    expect(layoutNumeral(0, WIDTH).lines).toEqual(['I']);
    expect(layoutNumeral(Number.NaN, WIDTH).lines).toEqual(['I']);
  });
});
