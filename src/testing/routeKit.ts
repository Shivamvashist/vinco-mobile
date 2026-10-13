/**
 * TESTS ONLY. Shared set-up for route tests that boot the real app with renderRouter:
 * the app folder, a clean slate for the stores, and arcs seeded straight into the test database.
 * Never imported by the app.
 */
import { createArc, db, nowIso, saveOrderAmount, updateDayLog } from '@/db';
import { DEFAULT_ORDER_TARGETS } from '@/features/orders';
import { addDays, toDayKey } from '@/lib/dates';
import { useDevStore, useNoticesStore, useOnboardingStore, usePreferencesStore } from '@/stores';

/** Where renderRouter finds the app's routes. */
export const APP_DIR = './src/app';

/** Stores back to a known state. Run in beforeEach (the database is cleared in jest.after-env.ts). */
export function resetAppState(): void {
  usePreferencesStore.setState({
    tone: 'centurion',
    colorMode: 'dark',
    soundEnabled: true,
    hapticsEnabled: true,
  });
  useOnboardingStore.getState().reset();
  useNoticesStore.setState({ acknowledgedLossDay: null });
  useDevStore.setState({ isDevModeOn: false, dayOffset: 0 });
}

/** An arc that started today, as if onboarding had just finished. */
export function startArc(): void {
  createArc(db, {
    lengthDays: 60,
    startDay: toDayKey(new Date()),
    wakeTime: '06:30',
    targets: DEFAULT_ORDER_TARGETS,
    oathPath: null,
  });
}

/** Wake-up logged for today, as if "I'm up" was reported: the orders are open. */
export function markAwake(): void {
  const today = toDayKey(new Date());
  saveOrderAmount(db, today, 'wake', 1);
  updateDayLog(db, today, { wokeAt: nowIso() });
}

/** Yesterday's bedtime, 8 hours before now: the wake sheet then defaults to 8 hours of sleep. */
export function seedBedtime(): void {
  const yesterday = addDays(toDayKey(new Date()), -1);
  updateDayLog(db, yesterday, { sleptAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() });
}

/** Holds every order at its minimum on one day. */
export function holdDay(day: string): void {
  saveOrderAmount(db, day, 'water', 1);
  saveOrderAmount(db, day, 'wake', 1);
  saveOrderAmount(db, day, 'meal', 1);
  saveOrderAmount(db, day, 'workout', 15);
}

/** An arc that started some days ago, with every day before today held at the minimum. */
export function startHeldArc(daysAgo: number, { missYesterday = false } = {}): void {
  const today = toDayKey(new Date());
  const start = addDays(today, -daysAgo);
  createArc(db, {
    lengthDays: 60,
    startDay: start,
    wakeTime: '06:30',
    targets: DEFAULT_ORDER_TARGETS,
    oathPath: null,
  });
  const lastHeld = missYesterday ? daysAgo - 1 : daysAgo;
  for (let offset = 0; offset < lastHeld; offset += 1) holdDay(addDays(start, offset));
}
