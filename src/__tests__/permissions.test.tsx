/** The shared permissions list: the onboarding step, the Permissions screen, Expo Go and the Vinco build. */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { getRecordingPermissionsAsync } from 'expo-audio';
import { useCameraPermissions } from 'expo-camera';
import { renderRouter } from 'expo-router/testing-library';
import { Linking } from 'react-native';

import { auroraCopy, focusCopy, onboardingCopy, permissionsCopy } from '@/copy';
import { auroraBridge } from '@/features/aurora';
import { guardBridge } from '@/features/guard';
import { useOnboardingStore } from '@/stores';
import { APP_DIR, resetAppState, startArc } from '@/testing/routeKit';

const copy = permissionsCopy;
type CameraHook = ReturnType<typeof useCameraPermissions>;

/** The camera as the fake reports it by default: allowed. */
const setCamera = (granted: boolean, request = jest.fn(async () => undefined)) => {
  jest
    .mocked(useCameraPermissions)
    .mockImplementation(
      () =>
        [
          { granted, canAskAgain: true, status: granted ? 'granted' : 'undetermined' },
          request,
          jest.fn(async () => undefined),
        ] as unknown as CameraHook,
    );
};

beforeEach(resetAppState);
afterEach(() => {
  setCamera(true);
  jest.restoreAllMocks();
});

describe('Onboarding permissions step', () => {
  it('comes after the tone, and Continue goes to the oath', async () => {
    useOnboardingStore.getState().setLastStep('permissions');
    const app = renderRouter(APP_DIR, { initialUrl: '/' });
    expect(await screen.findByText(onboardingCopy.permissions.title)).toBeTruthy();
    expect(app.getPathname()).toBe('/onboarding/permissions');
    expect(screen.getByLabelText(onboardingCopy.stepAccessibilityLabel(3, 5))).toBeTruthy();
    // Everything allowed (the fakes): no "Allow all", just Continue.
    await waitFor(() => expect(screen.queryByText(copy.status.checking)).toBeNull());
    expect(screen.queryByLabelText(onboardingCopy.permissions.allowAll)).toBeNull();

    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(onboardingCopy.continue));
    expect(await screen.findByText(onboardingCopy.oath.title)).toBeTruthy();
    expect(app.getPathname()).toBe('/onboarding/oath');
  });

  it('asks for what is still open with Allow all, and Continue still goes on', async () => {
    const requestCamera = jest.fn(async () => undefined);
    setCamera(false, requestCamera);
    const app = renderRouter(APP_DIR, { initialUrl: '/onboarding/permissions' });
    expect(await screen.findByText(copy.status.undetermined)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(onboardingCopy.permissions.allowAll));
    await waitFor(() => expect(requestCamera).toHaveBeenCalledTimes(1));

    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(onboardingCopy.continue));
    expect(await screen.findByText(onboardingCopy.oath.title)).toBeTruthy();
    expect(app.getPathname()).toBe('/onboarding/oath');
  });

  it('says the alarm and the guard arrive with the Vinco build in Expo Go', async () => {
    renderRouter(APP_DIR, { initialUrl: '/onboarding/permissions' });
    expect(await screen.findByText(copy.groups.guard)).toBeTruthy();
    expect(screen.getAllByText(copy.vincoBuild)).toHaveLength(2);
    expect(screen.queryByText(copy.items.accessibility.label)).toBeNull();
    expect(screen.queryByText(auroraCopy.status.exact)).toBeNull();
  });
});

describe('Permissions screen', () => {
  beforeEach(startArc);

  it('shows a refused microphone and sends the user to the phone settings', async () => {
    jest
      .mocked(getRecordingPermissionsAsync)
      .mockResolvedValueOnce({ granted: false, status: 'denied', canAskAgain: false } as never);
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    renderRouter(APP_DIR, { initialUrl: '/permissions' });

    expect(await screen.findByText(copy.status.denied)).toBeTruthy();
    const label = copy.actionAccessibilityLabel(copy.openSettings, copy.items.microphone.label);
    fireEvent.press(screen.getByLabelText(label));
    await waitFor(() => expect(openSettings).toHaveBeenCalledTimes(1));
    // Reminders and camera read as allowed.
    expect(screen.getAllByText(copy.status.granted).length).toBeGreaterThanOrEqual(2);
  });

  it('shows the alarm and the guard rows in the Vinco build, with the guard disclosure', async () => {
    jest.replaceProperty(auroraBridge, 'isSupported', true);
    jest.spyOn(auroraBridge, 'canScheduleExact').mockResolvedValue(true);
    jest.spyOn(auroraBridge, 'canUseFullScreenIntent').mockResolvedValue(false);
    const openFullScreen = jest.spyOn(auroraBridge, 'openFullScreenIntentSettings').mockResolvedValue();
    jest.replaceProperty(guardBridge, 'isSupported', true);
    jest.spyOn(guardBridge, 'getPermissions').mockResolvedValue({ accessibility: false, overlay: true });
    const openGuard = jest.spyOn(guardBridge, 'openPermissionSettings').mockResolvedValue();
    renderRouter(APP_DIR, { initialUrl: '/permissions' });

    expect(await screen.findByText(copy.items.accessibility.label)).toBeTruthy();
    expect(screen.queryByText(copy.vincoBuild)).toBeNull();
    expect(screen.getByText(focusCopy.permission.watches)).toBeTruthy();
    expect(screen.getByText(focusCopy.permission.stays)).toBeTruthy();
    expect(screen.getAllByText(copy.optional)).toHaveLength(2);

    const guardLabel = copy.actionAccessibilityLabel(
      focusCopy.permission.open,
      copy.items.accessibility.label,
    );
    fireEvent.press(await screen.findByLabelText(guardLabel));
    await waitFor(() => expect(openGuard).toHaveBeenCalledWith('accessibility'));
    // The overlay is on: no button for it.
    expect(
      screen.queryByLabelText(
        copy.actionAccessibilityLabel(focusCopy.permission.overlayOpen, copy.items.overlay.label),
      ),
    ).toBeNull();

    act(() => jest.advanceTimersByTime(600));
    const alarmLabel = copy.actionAccessibilityLabel(copy.openSettings, auroraCopy.status.fullScreen);
    fireEvent.press(await screen.findByLabelText(alarmLabel));
    await waitFor(() => expect(openFullScreen).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByLabelText(copy.actionAccessibilityLabel(copy.openSettings, auroraCopy.status.exact)),
    ).toBeNull();
  });
});
