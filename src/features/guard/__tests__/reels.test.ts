import { toNativeReelConfig, toReelEventCount } from '../reelBridge';
import {
  getMarkedPackages,
  getReelAppLabels,
  getReelBadgeStage,
  getReelStepIn,
  REEL_APPS,
  sanitizeReelDays,
  toReelCount,
} from '../reels';

describe('marked apps', () => {
  it('starts from the default reel apps and adds the user marks once', () => {
    const marked = getMarkedPackages([' org.example.reels ', 'com.instagram.android', '']);
    expect(marked.slice(0, REEL_APPS.length)).toEqual(REEL_APPS.map((app) => app.packageName));
    expect(marked).toContain('org.example.reels');
    expect(marked.filter((name) => name === 'com.instagram.android')).toHaveLength(1);
    expect(marked).not.toContain('');
  });

  it('names each app once (TikTok has two packages)', () => {
    expect(getReelAppLabels()).toEqual(['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Snapchat']);
  });
});

describe('reel step-ins', () => {
  it('never interrupts in Pax', () => {
    expect(getReelStepIn(30, 30, 'pax')).toBeNull();
    expect(getReelStepIn(25, 30, 'pax')).toBeNull();
  });

  it('steps in at the budget and every 25, the budget winning a tie', () => {
    expect(getReelStepIn(30, 30, 'vigil')).toBe('budget');
    expect(getReelStepIn(25, 30, 'vigil')).toBe('milestone');
    expect(getReelStepIn(50, 50, 'imperium')).toBe('budget');
    expect(getReelStepIn(75, 30, 'guard')).toBe('milestone');
    expect(getReelStepIn(31, 30, 'vigil')).toBeNull();
  });

  it('ignores counts that are not whole and positive', () => {
    expect(getReelStepIn(0, 30, 'vigil')).toBeNull();
    expect(getReelStepIn(-25, 30, 'vigil')).toBeNull();
    expect(getReelStepIn(25.5, 30, 'vigil')).toBeNull();
  });
});

describe('badge stage', () => {
  it('is calm, then near from 80% of the budget, then over past it', () => {
    expect(getReelBadgeStage(0, 30)).toBe('calm');
    expect(getReelBadgeStage(23, 30)).toBe('calm');
    expect(getReelBadgeStage(24, 30)).toBe('near');
    expect(getReelBadgeStage(30, 30)).toBe('near');
    expect(getReelBadgeStage(31, 30)).toBe('over');
    expect(getReelBadgeStage(4, 5)).toBe('near');
  });
});

describe('reel days from the phone', () => {
  it('keeps well-formed days, one per day, oldest first', () => {
    expect(
      sanitizeReelDays([
        { day: '2026-11-01', count: 12 },
        { day: '2026-10-31', count: 40.7 },
        { day: 'yesterday', count: 3 },
        { day: '2026-10-30', count: -1 },
        { day: '2026-10-29', count: '9' },
        null,
        { day: '2026-11-01', count: 13 },
      ]),
    ).toEqual([
      { day: '2026-10-31', count: 40 },
      { day: '2026-11-01', count: 13 },
    ]);
    expect(sanitizeReelDays('nope')).toEqual([]);
  });

  it('reads counts and events defensively', () => {
    expect(toReelCount(3)).toBe(3);
    expect(toReelCount(Number.NaN)).toBeNull();
    expect(toReelCount('3')).toBeNull();
    expect(toReelEventCount({ count: 7, day: '2026-11-01' })).toBe(7);
    expect(toReelEventCount({ count: -2 })).toBeNull();
    expect(toReelEventCount(null)).toBeNull();
  });
});

describe('native reel config', () => {
  it('cleans the level, budget, packages, words and colours', () => {
    expect(
      toNativeReelConfig({
        level: 'vigil',
        reelBudget: 33,
        markedPackages: [' com.instagram.android ', '', 'com.instagram.android'],
        copy: { badge: '{count} reels', close: '  ' },
        colors: { surface: '#26221E', over: 'rgba(0,0,0,0.5)' },
      }),
    ).toEqual({
      level: 'vigil',
      reelBudget: 35,
      markedPackages: ['com.instagram.android'],
      copy: { badge: '{count} reels' },
      colors: { surface: '#26221E' },
    });
  });

  it('falls back to Pax for an unknown level', () => {
    const config = toNativeReelConfig({
      level: 'tyrant' as never,
      reelBudget: 30,
      markedPackages: [],
    });
    expect(config.level).toBe('pax');
    expect(config.copy).toEqual({});
    expect(config.colors).toEqual({});
  });
});
