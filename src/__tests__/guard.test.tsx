/** Guard levels and Aurora: preview settings, saved now, working with the native build later. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { guardCopy } from '@/copy';
import { useGuardStore } from '@/stores';
import { APP_DIR, resetAppState, startArc } from '@/testing/routeKit';

beforeEach(() => {
  resetAppState();
  useGuardStore.getState().reset();
});

const press = (label: string | RegExp) => {
  act(() => jest.advanceTimersByTime(600));
  fireEvent.press(screen.getByLabelText(label));
};

describe('Guard', () => {
  it('opens from Settings, says it arrives with the build, and keeps the chosen level', async () => {
    startArc();
    const app = renderRouter(APP_DIR, { initialUrl: '/settings' });
    fireEvent.press(
      await screen.findByLabelText(`${guardCopy.settings.level}, ${guardCopy.levels.names.pax.plain}`),
    );
    expect(await screen.findByText(guardCopy.preview.title)).toBeTruthy();
    expect(app.getPathname()).toBe('/guard');
    press(new RegExp(`^${guardCopy.levels.names.vigil.name}`));
    expect(useGuardStore.getState().level).toBe('vigil');

    fireEvent(screen.getByLabelText(guardCopy.levels.budgetAdjust), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(useGuardStore.getState().reelBudget).toBe(35);
  });
});

describe('Aurora', () => {
  it('turns on at the wake-up time, picks days and a mission', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/aurora' });
    fireEvent(await screen.findByLabelText(guardCopy.aurora.on), 'valueChange', true);
    expect(useGuardStore.getState().aurora).toMatchObject({ isOn: true, minutes: 390 });
    expect(await screen.findByText(guardCopy.aurora.followsWake)).toBeTruthy();

    // Sunday off, then the sky mission.
    press('Sunday');
    expect(useGuardStore.getState().aurora.days).not.toContain(6);
    press(new RegExp(`^${guardCopy.aurora.missions.sky.name}`));
    expect(useGuardStore.getState().aurora.mission).toBe('sky');
    expect(screen.getByText(guardCopy.aurora.passes(0))).toBeTruthy();
  });

  it('shows the alarm state in Settings', async () => {
    startArc();
    act(() => useGuardStore.getState().updateAurora({ isOn: true, minutes: 330 }));
    renderRouter(APP_DIR, { initialUrl: '/settings' });
    expect(await screen.findByLabelText(`${guardCopy.settings.aurora}, 5:30 am`)).toBeTruthy();
  });
});
