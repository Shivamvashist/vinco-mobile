/** Focus ("Acies"): the CTA springs open, setup, running, the end paid once, and retreat paying nothing. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { Slot } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { FocusLauncher } from '@/components/focus/FocusLauncher';
import { focusCopy } from '@/copy';
import { db, getRunningFocus, selectFocusOn, startFocus } from '@/db';
import { ledger } from '@/db/schema';
import { toDayKey } from '@/lib/dates';
import { resetAppState } from '@/testing/routeKit';
import { DEFAULT_THEME_PREFERENCES, ThemeProvider } from '@/theme';

beforeEach(resetAppState);

const MINUTE = 60_000;

function Layout() {
  return (
    <ThemeProvider preferences={DEFAULT_THEME_PREFERENCES} onPreferencesChange={() => undefined}>
      <Slot />
    </ThemeProvider>
  );
}

function renderToday() {
  return renderRouter({ _layout: Layout, index: () => <FocusLauncher /> }, { initialUrl: '/' });
}

/** Opens the focus view from the CTA and lets the morph run. */
async function openFocus() {
  fireEvent.press(await screen.findByLabelText(focusCopy.cta.label));
  act(() => jest.advanceTimersByTime(1000));
  expect(await screen.findByText(focusCopy.setup.title)).toBeTruthy();
}

/** Runs the morph to its end: a frame for the UI thread, then the hop back to JS. */
function settleMotion() {
  act(() => {
    jest.advanceTimersByTime(100);
    jest.runAllTicks();
  });
}

const guardCard = (name: string) => screen.getByLabelText(new RegExp(`^${name},`));

describe('Focus', () => {
  it('opens from the CTA, begins 25 minutes of Imperium, and pays 8 at the end', async () => {
    renderToday();
    await openFocus();
    expect(screen.getByText(focusCopy.setup.notYet)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(focusCopy.setup.minutes(45)));
    fireEvent.press(guardCard(focusCopy.setup.guards.custos.name));
    expect(screen.getByText(focusCopy.setup.reward(9))).toBeTruthy();
    fireEvent.press(screen.getByLabelText(focusCopy.setup.minutes(25)));
    fireEvent.press(guardCard(focusCopy.setup.guards.imperium.name));
    expect(screen.getByText(focusCopy.setup.reward(8))).toBeTruthy();

    fireEvent.press(screen.getByLabelText(focusCopy.setup.begin));
    expect(await screen.findByLabelText(focusCopy.running.timeLeftLabel('25:00'))).toBeTruthy();
    expect(getRunningFocus(db)).toMatchObject({ guard: 'imperium', minutes: 25 });

    // Ticks land just after each second turns.
    act(() => jest.advanceTimersByTime(10 * MINUTE + 100));
    expect(screen.getByLabelText(focusCopy.running.timeLeftLabel('15:00'))).toBeTruthy();

    act(() => jest.advanceTimersByTime(15 * MINUTE + 1000));
    expect(await screen.findByText(focusCopy.complete.title)).toBeTruthy();
    expect(screen.getByText(focusCopy.complete.earned(8))).toBeTruthy();
    expect(db.select().from(ledger).all()).toEqual([
      expect.objectContaining({ day: toDayKey(new Date()), reason: 'focus_1', amount: 8 }),
    ]);

    fireEvent.press(screen.getByLabelText(focusCopy.complete.done));
    settleMotion();
    expect(screen.queryByText(focusCopy.complete.title)).toBeNull();
    expect(screen.getByLabelText(focusCopy.cta.label)).toBeTruthy();
  });

  it('minimises a running focus to the CTA, which shows the time left', async () => {
    renderToday();
    await openFocus();
    fireEvent.press(screen.getByLabelText(focusCopy.setup.begin));
    fireEvent.press(await screen.findByLabelText(focusCopy.running.minimise));
    settleMotion();
    act(() => jest.advanceTimersByTime(MINUTE));
    expect(screen.queryByText(focusCopy.running.retreat)).toBeNull();
    expect(screen.getByLabelText(focusCopy.cta.runningLabel('24:00'))).toBeTruthy();
    expect(screen.getByText(focusCopy.cta.left('24:00'))).toBeTruthy();
  });

  it('pays nothing when the user holds Retreat, and ignores a short press', async () => {
    renderToday();
    await openFocus();
    fireEvent.press(screen.getByLabelText(focusCopy.setup.begin));
    const retreat = await screen.findByLabelText(focusCopy.running.retreat);

    // Let go early: nothing happens.
    fireEvent(retreat, 'pressIn');
    act(() => jest.advanceTimersByTime(500));
    fireEvent(retreat, 'pressOut');
    act(() => jest.advanceTimersByTime(2000));
    expect(getRunningFocus(db)).toBeDefined();

    // Hold for the full second and a half.
    fireEvent(screen.getByLabelText(focusCopy.running.retreat), 'pressIn');
    act(() => jest.advanceTimersByTime(1600));
    expect(await screen.findByText(focusCopy.complete.retreatTitle)).toBeTruthy();
    expect(screen.getByText(focusCopy.complete.retreatBody)).toBeTruthy();
    expect(getRunningFocus(db)).toBeUndefined();
    expect(selectFocusOn(db, toDayKey(new Date())).all()[0]).toMatchObject({
      status: 'abandoned',
      reward: 0,
    });
    expect(db.select().from(ledger).all()).toEqual([]);
  });

  it('shows the completion of a focus that ended while the app was closed', async () => {
    const begun = new Date(Date.now() - 30 * MINUTE);
    startFocus(db, { day: toDayKey(begun), guard: 'silentium', minutes: 25 }, begun);
    renderToday();
    act(() => jest.advanceTimersByTime(1000));
    expect(await screen.findByText(focusCopy.complete.earned(10))).toBeTruthy();
  });
});
