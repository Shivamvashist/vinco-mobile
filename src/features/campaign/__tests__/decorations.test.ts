import type { DayRecord } from '../campaign';
import { type DecorationInput, getDecorations } from '../decorations';

const BASE: DecorationInput = {
  records: [],
  today: '2026-10-20',
  todayStatus: 'open',
  dayNumber: 1,
  lengthDays: 60,
  selfieDays: 0,
  hasOath: false,
};

function earnedIds(input: Partial<DecorationInput>): string[] {
  return getDecorations({ ...BASE, ...input })
    .filter((decoration) => decoration.isEarned)
    .map((decoration) => decoration.id);
}

/** Held days ending yesterday (19 Oct), oldest first. */
function heldRun(days: number): DayRecord[] {
  return Array.from({ length: days }, (_, index) => ({
    day: `2026-10-${String(19 - days + 1 + index).padStart(2, '0')}`,
    result: 'held' as const,
  }));
}

describe('getDecorations', () => {
  it('has nothing earned on a fresh arc', () => {
    expect(earnedIds({})).toEqual([]);
  });

  it('earns the first seal with today held, and the conqueror on a conquered day', () => {
    expect(earnedIds({ todayStatus: 'held' })).toEqual(['firstSeal']);
    expect(earnedIds({ todayStatus: 'conquered' })).toEqual(['firstSeal', 'conqueror']);
  });

  it('earns the iron week on seven days of campaign, never in the Ludus', () => {
    expect(earnedIds({ records: heldRun(7), dayNumber: 8 })).toContain('ironWeek');
    expect(earnedIds({ records: heldRun(6), dayNumber: 7 })).not.toContain('ironWeek');
    expect(earnedIds({ records: heldRun(7), dayNumber: 8, lengthDays: null })).not.toContain('ironWeek');
  });

  it('earns Resurgo for a comeback the day after a miss', () => {
    const records: DayRecord[] = [
      { day: '2026-10-17', result: 'missed' },
      { day: '2026-10-18', result: 'held' },
    ];
    expect(earnedIds({ records, dayNumber: 4 })).toContain('resurgo');
  });

  it('earns halfway past the middle of a campaign, or after 30 days trained in the Ludus', () => {
    expect(earnedIds({ records: heldRun(1), dayNumber: 31 })).toContain('halfway');
    expect(earnedIds({ records: heldRun(1), dayNumber: 30 })).not.toContain('halfway');
    expect(earnedIds({ records: heldRun(19), lengthDays: null, todayStatus: 'held' })).not.toContain(
      'halfway',
    );
  });

  it('earns proof keeper at seven selfies and oath keeper on Day X with an oath', () => {
    expect(earnedIds({ selfieDays: 7 })).toEqual(['proofKeeper']);
    expect(earnedIds({ hasOath: true, dayNumber: 10 })).toEqual(['oathKeeper']);
    expect(earnedIds({ hasOath: false, dayNumber: 10 })).toEqual([]);
  });
});
