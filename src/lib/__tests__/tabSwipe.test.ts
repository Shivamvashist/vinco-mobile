import { resolveSwipeTarget, type SwipeInput } from '../tabSwipe';

const BASE: SwipeInput = { index: 1, count: 3, translationX: 0, velocityX: 0, width: 400 };

function swipe(overrides: Partial<SwipeInput>): number | null {
  return resolveSwipeTarget({ ...BASE, ...overrides });
}

describe('resolveSwipeTarget', () => {
  it('moves to the next tab on a long drag to the left', () => {
    expect(swipe({ translationX: -120 })).toBe(2);
  });

  it('moves to the previous tab on a long drag to the right', () => {
    expect(swipe({ translationX: 120 })).toBe(0);
  });

  it('stays on a short slow drag', () => {
    expect(swipe({ translationX: -60, velocityX: -100 })).toBeNull();
  });

  it('moves on a short flick in the same direction', () => {
    expect(swipe({ translationX: -40, velocityX: -900 })).toBe(2);
    expect(swipe({ translationX: 40, velocityX: 900 })).toBe(0);
  });

  it('ignores a flick shorter than the least travel', () => {
    expect(swipe({ translationX: -10, velocityX: -2000 })).toBeNull();
  });

  it('stays when a long drag is flicked back', () => {
    expect(swipe({ translationX: -200, velocityX: 900 })).toBeNull();
  });

  it('has no tab past either end', () => {
    expect(swipe({ index: 0, translationX: 200 })).toBeNull();
    expect(swipe({ index: 2, translationX: -200 })).toBeNull();
  });

  it('stays on no movement or bad input', () => {
    expect(swipe({ translationX: 0 })).toBeNull();
    expect(swipe({ translationX: Number.NaN })).toBeNull();
    expect(swipe({ width: 0, translationX: -200 })).toBeNull();
    expect(swipe({ index: 5, translationX: -200 })).toBeNull();
    expect(swipe({ index: -1, translationX: 200 })).toBeNull();
  });
});
