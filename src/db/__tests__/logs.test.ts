import { getDayLog, selectRecentSelfies, updateDayLog } from '../dayLogs';
import {
  getOrderAmount,
  getOrderLogsForDay,
  saveOrderAmount,
  toOrderAmounts,
  toWorkoutNote,
} from '../orderLogs';
import type { OrderLogRow } from '../schema';
import { createTestDatabase } from '../testing/testDatabase';

const DAY = '2026-10-17';
const NOW = new Date('2026-10-17T07:00:00.000Z');

describe('order logs', () => {
  it('reads 0 for an order with no row yet', () => {
    const db = createTestDatabase();
    expect(getOrderAmount(db, DAY, 'water')).toBe(0);
    expect(toOrderAmounts(getOrderLogsForDay(db, DAY))).toEqual({ water: 0, wake: 0, meal: 0, workout: 0 });
  });

  it('creates a row, then updates the same row', () => {
    const db = createTestDatabase();
    saveOrderAmount(db, DAY, 'water', 1, { now: NOW });
    saveOrderAmount(db, DAY, 'water', 2, { now: NOW });
    const rows = getOrderLogsForDay(db, DAY);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.amount).toBe(2);
    expect(rows[0]?.updatedAt).toBe(NOW.toISOString());
  });

  it('keeps days separate', () => {
    const db = createTestDatabase();
    saveOrderAmount(db, DAY, 'meal', 2);
    saveOrderAmount(db, '2026-10-18', 'meal', 1);
    expect(getOrderAmount(db, DAY, 'meal')).toBe(2);
    expect(getOrderAmount(db, '2026-10-18', 'meal')).toBe(1);
  });

  it('keeps the note unless a new one is given', () => {
    const db = createTestDatabase();
    saveOrderAmount(db, DAY, 'workout', 40, { note: 'Push day' });
    saveOrderAmount(db, DAY, 'workout', 15);
    expect(toWorkoutNote(getOrderLogsForDay(db, DAY))).toBe('Push day');
    saveOrderAmount(db, DAY, 'workout', 0, { note: '' });
    expect(toWorkoutNote(getOrderLogsForDay(db, DAY))).toBe('');
  });

  it('ignores unknown kinds and broken amounts when reading rows', () => {
    const rows = [
      { day: DAY, kind: 'water', amount: 3, note: '', updatedAt: '' },
      { day: DAY, kind: 'sleep', amount: 8, note: '', updatedAt: '' },
      { day: DAY, kind: 'meal', amount: NaN, note: '', updatedAt: '' },
    ] as OrderLogRow[];
    expect(toOrderAmounts(rows)).toEqual({ water: 3, wake: 0, meal: 0, workout: 0 });
  });
});

describe('day logs', () => {
  it('is undefined until something happens that day', () => {
    const db = createTestDatabase();
    expect(getDayLog(db, DAY)).toBeUndefined();
  });

  it('creates and patches the day without losing other fields', () => {
    const db = createTestDatabase();
    updateDayLog(db, DAY, { wokeAt: '2026-10-17T01:04:00.000Z' });
    updateDayLog(db, DAY, { stampedAt: '2026-10-17T15:00:00.000Z' });
    expect(getDayLog(db, DAY)).toEqual({
      day: DAY,
      wokeAt: '2026-10-17T01:04:00.000Z',
      sleptAt: null,
      stampedAt: '2026-10-17T15:00:00.000Z',
      selfiePath: null,
      weightKg: null,
      sealedAt: null,
      result: null,
      truceUsed: false,
    });
  });

  it('can clear a field back to null', () => {
    const db = createTestDatabase();
    updateDayLog(db, DAY, { wokeAt: '2026-10-17T01:04:00.000Z' });
    updateDayLog(db, DAY, { wokeAt: null });
    expect(getDayLog(db, DAY)?.wokeAt).toBeNull();
  });

  it('does nothing for an empty patch', () => {
    const db = createTestDatabase();
    updateDayLog(db, DAY, {});
    expect(getDayLog(db, DAY)).toBeUndefined();
  });
});

describe('selectRecentSelfies', () => {
  it('lists days with a selfie, newest first, up to a day and a limit', () => {
    const db = createTestDatabase();
    updateDayLog(db, '2026-10-14', { selfiePath: 'a.jpg' });
    updateDayLog(db, '2026-10-15', { wokeAt: '2026-10-15T01:00:00.000Z' });
    updateDayLog(db, '2026-10-16', { selfiePath: 'c.jpg' });
    updateDayLog(db, '2026-10-18', { selfiePath: 'future.jpg' });
    expect(selectRecentSelfies(db, '2026-10-17', 6).all()).toEqual([
      { day: '2026-10-16', selfiePath: 'c.jpg' },
      { day: '2026-10-14', selfiePath: 'a.jpg' },
    ]);
    expect(selectRecentSelfies(db, '2026-10-17', 1).all()).toHaveLength(1);
  });
});
