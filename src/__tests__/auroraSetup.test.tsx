/** Aurora's guided setup: the happy path saves the draft and turns Aurora on. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { auroraSetupCopy, guardCopy } from '@/copy';
import { useAuroraInviteStore, useGuardStore } from '@/stores';
import { APP_DIR, resetAppState, startArc } from '@/testing/routeKit';

beforeEach(() => {
  resetAppState();
  useGuardStore.getState().reset();
  useAuroraInviteStore.getState().reset();
});

const press = (label: string | RegExp) => {
  act(() => jest.advanceTimersByTime(600));
  fireEvent.press(screen.getByLabelText(label));
};

describe('Aurora setup', () => {
  it('walks the four steps and turns Aurora on at the wake-up time', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/aurora-setup' });
    expect(await screen.findByText(auroraSetupCopy.intro.title)).toBeTruthy();
    press(auroraSetupCopy.continue);

    // Sunday off. Nothing is saved yet.
    expect(await screen.findByText(auroraSetupCopy.when.title)).toBeTruthy();
    press('Sunday');
    press(auroraSetupCopy.continue);
    expect(useGuardStore.getState().aurora.isOn).toBe(false);

    expect(await screen.findByText(auroraSetupCopy.mission.title)).toBeTruthy();
    press(new RegExp(`^${guardCopy.aurora.missions.gladius.name}`));
    press(auroraSetupCopy.continue);

    expect(await screen.findByText(auroraSetupCopy.permissions.title)).toBeTruthy();
    press(auroraSetupCopy.finish);
    expect(await screen.findByText(auroraSetupCopy.done.title)).toBeTruthy();
    expect(useGuardStore.getState().aurora).toMatchObject({
      isOn: true,
      minutes: 390,
      days: [0, 1, 2, 3, 4, 5],
      mission: 'gladius',
    });
    expect(useAuroraInviteStore.getState().isClosed).toBe(true);
  });
});
