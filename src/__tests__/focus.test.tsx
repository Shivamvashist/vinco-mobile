/**
 * Focus ("Acies"): the Focus tile opens the screen, setup and slide to begin, the No Truce sheet,
 * the end paid once behind a Claim, retreats paid with a Truce, denarii or the stand-down, the
 * Silentium lock, the screensaver, and reopening on launch.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Brightness from 'expo-brightness';
import { renderRouter } from 'expo-router/testing-library';

import { focusCopy, rewardsCopy } from '@/copy';
import {
  db,
  getDenariiBalance,
  getRunningFocus,
  getTruceReserve,
  nowIso,
  selectFocusOn,
  settleFocus,
  startFocus,
} from '@/db';
import { ledger, truces } from '@/db/schema';
import { toDayKey } from '@/lib/dates';
import { APP_DIR, markAwake, resetAppState, startArc } from '@/testing/routeKit';

beforeEach(resetAppState);

const MINUTE = 60_000;
const today = () => toDayKey(new Date());

function holdTruce() {
  db.insert(truces).values({ day: today(), reason: 'forum', amount: 1, createdAt: nowIso() }).run();
}

function earn(amount: number) {
  db.insert(ledger).values({ day: '2026-01-01', reason: 'day_conquered', amount, createdAt: nowIso() }).run();
}

function slide(label: string) {
  fireEvent(screen.getByLabelText(label), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
}

const guardCard = (name: string) => screen.getByLabelText(new RegExp(`^${name},`));

async function openSetup() {
  const app = renderRouter(APP_DIR, { initialUrl: '/focus' });
  expect(await screen.findByText(focusCopy.setup.title)).toBeTruthy();
  return app;
}

describe('Focus setup', () => {
  it('begins 25 minutes of Imperium after the No Truce sheet, and pays 8 behind the Claim', async () => {
    await openSetup();
    expect(screen.getByText(focusCopy.setup.notYet)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(focusCopy.spokenDuration(45)));
    fireEvent.press(guardCard(focusCopy.setup.guards.custos.name));
    expect(screen.getByText(focusCopy.setup.reward(9, 45))).toBeTruthy();
    fireEvent.press(screen.getByLabelText(focusCopy.spokenDuration(25)));
    fireEvent.press(guardCard(focusCopy.setup.guards.imperium.name));
    expect(screen.getByText(focusCopy.setup.reward(8, 25))).toBeTruthy();
    expect(screen.getByText(focusCopy.setup.guards.imperium.rules[1] ?? '')).toBeTruthy();

    slide(focusCopy.setup.begin);
    expect(await screen.findByText(focusCopy.noTruce.title)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(focusCopy.noTruce.beginAnyway));
    expect(await screen.findByLabelText(focusCopy.active.timeLeftLabel('0:25:00'))).toBeTruthy();
    expect(getRunningFocus(db)).toMatchObject({ guard: 'imperium', minutes: 25 });

    act(() => jest.advanceTimersByTime(25 * MINUTE + 1000));
    expect(await screen.findByText(focusCopy.complete.title)).toBeTruthy();
    // Paid at completion; the Claim only reveals it.
    expect(db.select().from(ledger).all()).toEqual([
      expect.objectContaining({ day: today(), reason: 'focus_1', amount: 8 }),
    ]);
    expect(screen.queryByText(focusCopy.complete.earned(8))).toBeNull();
    fireEvent.press(screen.getByLabelText(focusCopy.complete.claimLabel(8, 25)));
    expect(await screen.findByText(focusCopy.complete.earned(8))).toBeTruthy();
    expect(screen.getByText(focusCopy.complete.gloria(25))).toBeTruthy();
    // The counters show on the result, so the claim has somewhere to fly.
    expect(screen.getByLabelText(rewardsCopy.hud.denariiLabel(8))).toBeTruthy();
    expect(screen.getByLabelText(focusCopy.complete.done)).toBeTruthy();
  });

  it('takes a custom length in whole minutes', async () => {
    holdTruce();
    await openSetup();
    fireEvent.press(screen.getByLabelText(focusCopy.setup.customLabel));
    fireEvent.changeText(await screen.findByLabelText(focusCopy.custom.hours), '1');
    fireEvent.changeText(screen.getByLabelText(focusCopy.custom.minutes), '7');
    fireEvent.press(screen.getByLabelText(focusCopy.custom.set));
    expect(await screen.findByText('1:07')).toBeTruthy();

    slide(focusCopy.setup.begin);
    expect(await screen.findByLabelText(focusCopy.active.timeLeftLabel('1:07:00'))).toBeTruthy();
    expect(getRunningFocus(db)).toMatchObject({ minutes: 67 });
  });

  it('refuses a custom length past three hours', async () => {
    await openSetup();
    fireEvent.press(screen.getByLabelText(focusCopy.setup.customLabel));
    fireEvent.changeText(await screen.findByLabelText(focusCopy.custom.hours), '3');
    fireEvent.changeText(screen.getByLabelText(focusCopy.custom.minutes), '1');
    fireEvent.press(screen.getByLabelText(focusCopy.custom.set));
    expect(await screen.findByText(focusCopy.custom.invalid)).toBeTruthy();
  });

  it('lists finished sessions in the log, with the minutes held', async () => {
    // Held and settled before this app start, so it is history, not a result to show.
    const begun = new Date(Date.now() - 2 * 60 * MINUTE);
    startFocus(db, { day: today(), guard: 'custos', minutes: 45 }, begun);
    settleFocus(db, new Date(begun.getTime() - MINUTE + 46 * MINUTE));
    await openSetup();
    expect(screen.getByLabelText(`${focusCopy.log.today}, ${focusCopy.spokenDuration(45)}`)).toBeTruthy();
    expect(screen.getByText(focusCopy.log.held)).toBeTruthy();
  });
});

describe('Retreat', () => {
  async function beginFocus(guard: 'custos' | 'silentium' = 'custos') {
    await openSetup();
    fireEvent.press(guardCard(focusCopy.setup.guards[guard].name));
    slide(focusCopy.setup.begin);
    const anyway = screen.queryByLabelText(focusCopy.noTruce.beginAnyway);
    if (anyway) fireEvent.press(anyway);
    expect(await screen.findByLabelText(focusCopy.active.retreat)).toBeTruthy();
  }

  it('spends a Truce, and pays nothing', async () => {
    holdTruce();
    await beginFocus();
    slide(focusCopy.active.retreat);
    expect(await screen.findByText(focusCopy.complete.retreatTitle)).toBeTruthy();
    expect(getTruceReserve(db)).toBe(0);
    expect(selectFocusOn(db, today()).all()[0]).toMatchObject({ status: 'abandoned', reward: 0 });
    expect(db.select().from(ledger).all()).toEqual([]);
  });

  it('costs 50 denarii with no Truce held', async () => {
    earn(60);
    await beginFocus();
    slide(focusCopy.active.retreat);
    expect(await screen.findByText(focusCopy.complete.retreatTitle)).toBeTruthy();
    expect(getDenariiBalance(db)).toBe(10);
  });

  it('stands down for 30 seconds with neither, and can be cancelled', async () => {
    earn(20);
    await beginFocus();
    slide(focusCopy.active.retreat);
    expect(await screen.findByText(focusCopy.active.standDownLeft(30))).toBeTruthy();
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.getByText(focusCopy.active.standDownLeft(25))).toBeTruthy();
    fireEvent.press(screen.getByLabelText(focusCopy.active.standDownCancel));
    act(() => jest.advanceTimersByTime(40_000));
    expect(getRunningFocus(db)).toBeDefined();
    // The screen went to sleep meanwhile: a touch wakes it.
    fireEvent(screen.getByHintText(focusCopy.active.wake), 'touchStart');

    slide(focusCopy.active.retreat);
    act(() => jest.advanceTimersByTime(31_000));
    expect(await screen.findByText(focusCopy.complete.retreatTitle)).toBeTruthy();
    expect(getRunningFocus(db)).toBeUndefined();
    expect(getDenariiBalance(db)).toBe(20);
  });

  it('locks the screen under Silentium: no minimise', async () => {
    holdTruce();
    await beginFocus('silentium');
    expect(screen.getByText(focusCopy.active.locked)).toBeTruthy();
    expect(screen.queryByLabelText(focusCopy.active.minimise)).toBeNull();
  });
});

describe('Screensaver', () => {
  it('dims after 10 seconds without a touch, and a touch restores the brightness', async () => {
    holdTruce();
    await openSetup();
    slide(focusCopy.setup.begin);
    expect(await screen.findByLabelText(focusCopy.active.retreat)).toBeTruthy();
    act(() => jest.advanceTimersByTime(10_500));
    await waitFor(() => expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(0.06));
    // The controls fade; the clock drifts alone.
    expect(screen.getByLabelText(focusCopy.active.timeLeftLabel('0:24:50'))).toBeTruthy();
    fireEvent(screen.getByHintText(focusCopy.active.wake), 'touchStart');
    // Tests run as iOS: the saved brightness comes back (Android hands back to the system).
    await waitFor(() => expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(0.5));
    expect(screen.queryByHintText(focusCopy.active.wake)).toBeNull();
  });
});

describe('Focus tile on Today', () => {
  it('shows Ready and opens the focus screen', async () => {
    startArc();
    markAwake();
    const app = renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(focusCopy.tile.label));
    expect(await screen.findByText(focusCopy.setup.title)).toBeTruthy();
    expect(app.getPathname()).toBe('/focus');
    // The old purse tile is gone (the HUD counts denarii now).
    expect(screen.queryByLabelText(/^Purse,/)).toBeNull();
  });

  it('reopens a focus still running when the app starts', async () => {
    startArc();
    markAwake();
    startFocus(db, { day: today(), guard: 'imperium', minutes: 25 }, new Date(Date.now() - MINUTE));
    const app = renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByLabelText(focusCopy.active.retreat)).toBeTruthy();
    expect(app.getPathname()).toBe('/focus');
  });

  it('stays on Today after Done on a result shown on the focus screen (never reopens it)', async () => {
    startArc();
    markAwake();
    const app = renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(focusCopy.tile.label));
    expect(await screen.findByText(focusCopy.setup.title)).toBeTruthy();
    await act(async () => {
      startFocus(db, { day: today(), guard: 'custos', minutes: 25 });
    });
    act(() => jest.advanceTimersByTime(25 * MINUTE + 1000));
    fireEvent.press(await screen.findByLabelText(focusCopy.complete.claimLabel(5, 25)));
    fireEvent.press(await screen.findByLabelText(focusCopy.complete.done));
    act(() => jest.advanceTimersByTime(2000));
    expect(app.getPathname()).toBe('/veni');
    expect(screen.queryByText(focusCopy.setup.title)).toBeNull();
  });

  it('shows the result of a focus that ended while the app was closed', async () => {
    startArc();
    markAwake();
    const begun = new Date(Date.now() - 30 * MINUTE);
    startFocus(db, { day: toDayKey(begun), guard: 'silentium', minutes: 25 }, begun);
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    act(() => jest.advanceTimersByTime(1000));
    fireEvent.press(await screen.findByLabelText(focusCopy.complete.claimLabel(10, 25)));
    expect(await screen.findByText(focusCopy.complete.earned(10))).toBeTruthy();
  });
});
