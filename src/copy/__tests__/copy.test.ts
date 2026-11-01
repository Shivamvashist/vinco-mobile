import { periodBuckets, periodOf } from '@/features/periods';
import { TONES } from '@/features/tone';

import {
  arcCopy,
  commonCopy,
  focusCopy,
  isTabName,
  periodsCopy,
  pickTone,
  progressCopy,
  rewardsCopy,
  tabAccessibilityLabel,
  todayCopy,
} from '..';

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
  const allToneLines = [
    progressCopy.emptyLine,
    arcCopy.emptyLine,
    focusCopy.history.empty,
    rewardsCopy.gloriaHistory.empty,
  ];

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

describe('todayCopy orders', () => {
  it('words own orders by count, done, and an older minimum', () => {
    expect(todayCopy.customOrder.line(3, 12, 12, 'glass', 'none')).toBe('3 of 12 glass');
    expect(todayCopy.customOrder.line(12, 12, 12, 'glass', 'full')).toBe('12 glass · done');
    expect(todayCopy.customOrder.line(10, 10, 30, 'pages', 'min')).toBe('10 of 30 pages · minimum held');
    expect(todayCopy.customOrder.line(0, 1, 1, 'hour', 'none')).toBe('0 of 1 hour');
    // Done or not: no unit, once a day.
    expect(todayCopy.customOrder.line(0, 1, 1, '', 'none')).toBe('Not done yet');
    expect(todayCopy.customOrder.line(1, 1, 1, '', 'full')).toBe('Done');
    expect(todayCopy.customOrder.action('check')).toBe('Done');
  });

  it('words water and meal lines for each status', () => {
    expect(todayCopy.orders.water.line(0, 4, 'none')).toBe('0 of 4 L');
    expect(todayCopy.orders.water.line(2.5, 4, 'min')).toBe('2.5 of 4 L · minimum held');
    expect(todayCopy.orders.water.line(4, 4, 'full')).toBe('4 of 4 L · conquered');
    expect(todayCopy.orders.meal.line(1, 1, 'full')).toBe('1 of 1 meal · conquered');
  });
});

describe('period labels', () => {
  const today = '2026-11-01';

  it('names each period', () => {
    expect(periodsCopy.label(periodOf('day', today), today)).toBe('Today');
    expect(periodsCopy.label(periodOf('day', '2026-10-31'), today)).toBe('Yesterday');
    expect(periodsCopy.label(periodOf('day', '2026-10-27'), today)).toBe('Tuesday 27 October');
    expect(periodsCopy.label(periodOf('week', '2026-10-28'), today)).toBe('26 Oct to 1 Nov');
    expect(periodsCopy.label(periodOf('week', '2025-10-28'), today)).toBe('27 Oct to 2 Nov 2025');
    expect(periodsCopy.label(periodOf('week', '2026-12-30'), today)).toBe('28 Dec 2026 to 3 Jan 2027');
    expect(periodsCopy.label(periodOf('month', '2026-10-05'), today)).toBe('October 2026');
    expect(periodsCopy.label(periodOf('year', today), today)).toBe('2026');
  });

  it('labels bars under the chart', () => {
    const [monday] = periodBuckets(periodOf('week', today));
    const year = periodBuckets(periodOf('year', today));
    expect(monday && periodsCopy.axisLabel('week', monday)).toBe('M');
    expect(year[9] && periodsCopy.axisLabel('year', year[9])).toBe('O');
    expect(year[9] && periodsCopy.bucketName('year', year[9], today)).toBe('October 2026');
  });
});
