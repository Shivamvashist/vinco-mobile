/** The Castra (Settings) tab: preferences, the day's setup, the oath, the retreat and dev mode. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { arcCopy, commonCopy, devCopy, onboardingCopy, settingsCopy, tabAccessibilityLabel } from '@/copy';
import { createArc, db, getActiveArc, getDayLog, getTruceReserve } from '@/db';
import { DEFAULT_ORDER_TARGETS } from '@/features/orders';
import { addDays, toDayKey } from '@/lib/dates';
import { useDevStore, usePreferencesStore } from '@/stores';
import { APP_DIR, resetAppState, startArc, startHeldArc } from '@/testing/routeKit';

const rows = settingsCopy.rows;

beforeEach(resetAppState);

describe('Settings', () => {
  it('opens from its own tab', async () => {
    startArc();
    const app = renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(tabAccessibilityLabel('settings')));
    expect(await screen.findByText(settingsCopy.eyebrow)).toBeTruthy();
    expect(app.getPathname()).toBe('/settings');
    expect(screen.getByLabelText(`${rows.oath}, ${rows.oathNone}`)).toBeTruthy();
  });

  it('changes tone and appearance from the sheets, and toggles sound', async () => {
    startHeldArc(0);
    renderRouter(APP_DIR, { initialUrl: '/settings' });
    fireEvent.press(await screen.findByLabelText(`${rows.tone}, Centurion`));
    fireEvent.press(await screen.findByLabelText(/^Roast me/));
    expect(usePreferencesStore.getState().tone).toBe('roast');

    fireEvent.press(screen.getByLabelText(`${rows.colorMode}, ${settingsCopy.colorModes.dark}`));
    fireEvent.press(await screen.findByLabelText(settingsCopy.colorModes.light));
    expect(usePreferencesStore.getState().colorMode).toBe('light');

    fireEvent(screen.getByLabelText(rows.sound), 'valueChange', false);
    expect(usePreferencesStore.getState().soundEnabled).toBe(false);
  });

  it('sets the selfie outline strength', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/settings' });
    fireEvent.press(await screen.findByLabelText(`${rows.outline}, ${rows.outlineValue(30)}`));
    fireEvent(await screen.findByLabelText(settingsCopy.sheets.outline.label), 'valueChange', 0.5);
    expect(usePreferencesStore.getState().ghostOpacity).toBe(0.5);
  });

  it('changes the wake-up time', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/settings' });
    fireEvent.press(await screen.findByLabelText(`${rows.wakeTime}, 6:30 am`));
    fireEvent.press(await screen.findByLabelText(settingsCopy.sheets.wakeTime.save));
    expect(getActiveArc(db)?.wakeTime).toBe('06:30');
  });

  it('shows only the preferences before an arc begins', async () => {
    renderRouter(APP_DIR, { initialUrl: '/settings' });
    expect(await screen.findByText(settingsCopy.eyebrow)).toBeTruthy();
    expect(screen.queryByLabelText(new RegExp(`^${rows.wakeTime}`))).toBeNull();
    expect(screen.queryByLabelText(new RegExp(`^${rows.retreat}`))).toBeNull();
  });
});

describe('Sound the retreat', () => {
  it('runs only after the word is typed, then returns to the Rubicon', async () => {
    startHeldArc(2);
    const app = renderRouter(APP_DIR, { initialUrl: '/settings' });
    fireEvent.press(await screen.findByLabelText(`${rows.retreat}, ${rows.retreatValue}`));
    const field = await screen.findByLabelText(arcCopy.retreat.fieldLabel(arcCopy.retreat.word));
    const confirm = () => screen.getByRole('button', { name: arcCopy.retreat.confirm });

    fireEvent.changeText(field, 'retire');
    expect(confirm()).toBeDisabled();
    fireEvent.changeText(field, ' retreat ');
    expect(confirm()).toBeEnabled();
    fireEvent.press(confirm());

    expect(await screen.findByText(onboardingCopy.rubicon.cross)).toBeTruthy();
    expect(app.getPathname()).toBe('/onboarding');
    expect(getActiveArc(db)).toBeUndefined();
    expect(getTruceReserve(db)).toBe(0);
  });

  it('keeps preferences', async () => {
    startHeldArc(1);
    act(() => usePreferencesStore.getState().setTone('roast'));
    renderRouter(APP_DIR, { initialUrl: '/settings' });
    fireEvent.press(await screen.findByLabelText(`${rows.retreat}, ${rows.retreatValue}`));
    fireEvent.changeText(
      await screen.findByLabelText(arcCopy.retreat.fieldLabel(arcCopy.retreat.word)),
      arcCopy.retreat.word,
    );
    fireEvent.press(screen.getByRole('button', { name: arcCopy.retreat.confirm }));
    await screen.findByText(onboardingCopy.rubicon.cross);
    expect(usePreferencesStore.getState().tone).toBe('roast');
  });
});

describe('Dev mode', () => {
  it('fills today, moves to the next day and seals it', async () => {
    startArc();
    const today = toDayKey(new Date());
    const tomorrow = addDays(today, 1);
    renderRouter(APP_DIR, { initialUrl: '/settings' });
    fireEvent(await screen.findByLabelText(rows.devMode), 'valueChange', true);
    expect(await screen.findByText(devCopy.today(commonCopy.fullDateLabel(today), 0))).toBeTruthy();

    fireEvent.press(screen.getByLabelText(devCopy.conquerToday));
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(devCopy.nextDay));
    expect(await screen.findByText(devCopy.today(commonCopy.fullDateLabel(tomorrow), 1))).toBeTruthy();
    expect(getDayLog(db, today)?.sealedAt).toBeTruthy();
  });

  it('resets everything back to the Rubicon and the real clock', async () => {
    // The simulated clock is 3 days ahead and the arc began on that day, so nothing was missed.
    createArc(db, {
      lengthDays: 60,
      startDay: addDays(toDayKey(new Date()), 3),
      wakeTime: '06:30',
      targets: DEFAULT_ORDER_TARGETS,
      oathPath: null,
    });
    useDevStore.setState({ isDevModeOn: true, dayOffset: 3 });
    act(() => usePreferencesStore.getState().setTone('roast'));
    const app = renderRouter(APP_DIR, { initialUrl: '/settings' });
    fireEvent.press(await screen.findByLabelText(devCopy.resetAll));
    const buttons = await screen.findAllByRole('button', { name: devCopy.resetAll });
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(buttons[buttons.length - 1]!);

    expect(await screen.findByText(onboardingCopy.rubicon.cross)).toBeTruthy();
    expect(app.getPathname()).toBe('/onboarding');
    expect(getActiveArc(db)).toBeUndefined();
    expect(useDevStore.getState().dayOffset).toBe(0);
    expect(usePreferencesStore.getState().tone).toBe('centurion');
  });
});
