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
  const allToneLines = [...todayCopy.progressLines, progressCopy.emptyLine, arcCopy.emptyLine];

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

describe('todayCopy.progressLine', () => {
  it('picks the line by orders held, for any number', () => {
    expect(todayCopy.progressLine(0, 4)).toBe(todayCopy.progressLines[0]);
    expect(todayCopy.progressLine(1, 4)).toBe(todayCopy.progressLines[0]);
    expect(todayCopy.progressLine(2, 4)).toBe(todayCopy.progressLines[1]);
    expect(todayCopy.progressLine(3, 4)).toBe(todayCopy.progressLines[2]);
    expect(todayCopy.progressLine(4, 4)).toBe(todayCopy.progressLines[3]);
    expect(todayCopy.progressLine(-1, 4)).toBe(todayCopy.progressLines[0]);
    expect(todayCopy.progressLine(9, 4)).toBe(todayCopy.progressLines[3]);
    // With own orders: 3 of 6 is halfway, 5 of 6 is one left.
    expect(todayCopy.progressLine(2, 6)).toBe(todayCopy.progressLines[0]);
    expect(todayCopy.progressLine(3, 6)).toBe(todayCopy.progressLines[1]);
    expect(todayCopy.progressLine(5, 6)).toBe(todayCopy.progressLines[2]);
  });

  it('words water and meal lines for each status', () => {
    expect(todayCopy.orders.water.line(0, 4, 'none')).toBe('0 of 4 L');
    expect(todayCopy.orders.water.line(2.5, 4, 'min')).toBe('2.5 of 4 L · minimum held');
    expect(todayCopy.orders.water.line(4, 4, 'full')).toBe('4 of 4 L · conquered');
    expect(todayCopy.orders.meal.line(1, 1, 'full')).toBe('1 of 1 meal · conquered');
  });
});
