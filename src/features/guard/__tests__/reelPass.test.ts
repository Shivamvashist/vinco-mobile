import {
  checkReelPass,
  countReelPasses,
  getReelAllowanceWithPasses,
  getReelBlockMode,
  isReelBlocked,
  nextReelPassReason,
  reelPassShort,
} from '../reelPass';

describe('reel pass rules', () => {
  it('adds 12 reels per pass, at most three', () => {
    expect(getReelAllowanceWithPasses(30, 0)).toBe(30);
    expect(getReelAllowanceWithPasses(30, 2)).toBe(54);
    expect(getReelAllowanceWithPasses(30, 9)).toBe(66);
    expect(getReelAllowanceWithPasses(30, Number.NaN)).toBe(30);
  });

  it('counts each pass of a day once and ignores other reasons', () => {
    expect(countReelPasses(['reel_pass_1', 'day_held', 'reel_pass_1', 'reel_pass_2'])).toBe(2);
    expect(nextReelPassReason(0)).toBe('reel_pass_1');
    expect(nextReelPassReason(2)).toBe('reel_pass_3');
    expect(nextReelPassReason(3)).toBeNull();
  });

  it('checks the daily limit before the price', () => {
    expect(checkReelPass(20, 0)).toBe('ok');
    expect(checkReelPass(19, 0)).toBe('cannotAfford');
    expect(checkReelPass(1000, 3)).toBe('dailyLimit');
    expect(checkReelPass(Number.NaN, 0)).toBe('cannotAfford');
    expect(reelPassShort(12)).toBe(8);
    expect(reelPassShort(-5)).toBe(20);
  });

  it('blocks past the allowance at Vigil and up; only Vigil can close it', () => {
    expect(getReelBlockMode('pax')).toBeNull();
    expect(getReelBlockMode('vigil')).toBe('closable');
    expect(getReelBlockMode('guard')).toBe('firm');
    expect(getReelBlockMode('imperium')).toBe('firm');
    expect(isReelBlocked(31, 30, 'vigil')).toBe(true);
    expect(isReelBlocked(30, 30, 'vigil')).toBe(false);
    expect(isReelBlocked(99, 30, 'pax')).toBe(false);
  });
});
