import { TONES } from '@/features/tone';

import { arcCopy, commonCopy, isTabName, pickTone, progressCopy, tabAccessibilityLabel, todayCopy } from '..';

describe('commonCopy', () => {
  it('has seven weekdays starting on Sunday, like Date.getDay()', () => {
    expect(commonCopy.weekdays).toHaveLength(7);
    expect(commonCopy.weekdays[0]).toBe('Sunday');
    expect(commonCopy.weekdays[6]).toBe('Saturday');
  });

  it('words days left correctly for 0, 1 and many', () => {
    expect(commonCopy.daysLeftInYear(0, 2026)).toBe('Last day of 2026');
    expect(commonCopy.daysLeftInYear(-3, 2026)).toBe('Last day of 2026');
    expect(commonCopy.daysLeftInYear(1, 2026)).toBe('1 day left in 2026');
    expect(commonCopy.daysLeftInYear(75, 2026)).toBe('75 days left in 2026');
  });
});

describe('tone lines', () => {
  const allToneLines = [todayCopy.emptyLine, progressCopy.emptyLine, arcCopy.emptyLine];

  it('have a non-empty line for every tone', () => {
    for (const lines of allToneLines) {
      for (const tone of TONES) expect(pickTone(lines, tone).trim().length).toBeGreaterThan(0);
    }
  });
});

describe('tabs', () => {
  it('recognises only real tab names', () => {
    expect(isTabName('veni')).toBe(true);
    expect(isTabName('vici')).toBe(true);
    expect(isTabName('index')).toBe(false);
    expect(isTabName('toString')).toBe(false);
  });

  it('builds accessibility labels', () => {
    expect(tabAccessibilityLabel('vidi')).toBe('Vidi, Progress');
  });
});
