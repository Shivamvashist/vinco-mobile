import { useCallback, useEffect, useState } from 'react';
import { AppState, PermissionsAndroid, Platform, View } from 'react-native';

import { auroraCopy, commonCopy } from '@/copy';
import { type AuroraSettings, auroraBridge, planAuroraRing } from '@/features/aurora';
import { auroraNotice } from '@/hooks/useAuroraSchedule';
import { formatClockTime, toDayKey } from '@/lib/dates';
import { IS_DEV_MODE_AVAILABLE, usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { SettingsGroup } from '../settings/SettingsGroup';
import { SettingsRow } from '../settings/SettingsRow';
import { Txt } from '../Txt';

const copy = auroraCopy.status;
const TEST_DELAY_MS = 60_000;
/** Lets the schedule hook send a settings change before the status reads it back. */
const REFRESH_AFTER_CHANGE_MS = 600;
const ANDROID_VERSION = Platform.OS === 'android' ? Number(Platform.Version) : 0;

type Status = { exact: boolean; fullScreen: boolean; notifications: boolean; nextRing: Date | null };

/** Live state of the alarm on this phone (Vinco build only): next ring, permissions, a dev test. */
export function AuroraStatus({ settings }: { settings: AuroraSettings }) {
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);
  const [status, setStatus] = useState<Status | null>(null);
  const [testNote, setTestNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [exact, fullScreen, notifications, nextRing] = await Promise.all([
        auroraBridge.canScheduleExact(),
        auroraBridge.canUseFullScreenIntent(),
        auroraBridge.areNotificationsEnabled(),
        auroraBridge.getNextRing(),
      ]);
      setStatus({ exact, fullScreen, notifications, nextRing });
    } catch (error) {
      if (__DEV__) console.warn('[aurora] Could not read the alarm status.', error);
    }
  }, []);

  // Read again when the user comes back from a settings page, and after each settings change.
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), REFRESH_AFTER_CHANGE_MS);
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [refresh, settings]);

  const allowNotifications = async () => {
    if (ANDROID_VERSION >= 33) {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (result === PermissionsAndroid.RESULTS.GRANTED) return refresh();
    }
    await auroraBridge.openNotificationSettings();
  };

  const runTest = async () => {
    const plan = planAuroraRing(settings, new Date());
    try {
      await auroraBridge.schedule(
        new Date(Date.now() + TEST_DELAY_MS),
        auroraNotice(tone),
        plan.kind === 'schedule' ? { minutes: plan.minutes, daysMask: plan.daysMask } : undefined,
      );
      setTestNote(copy.testSet);
      await refresh();
    } catch {
      setTestNote(copy.testFailed);
    }
  };

  const yesOr = (isAllowed: boolean | undefined) =>
    isAllowed == null ? '' : isAllowed ? copy.allowed : copy.allow;
  const now = new Date();
  const next = status?.nextRing;

  return (
    <View style={styles.block}>
      <SettingsGroup title={copy.title}>
        <SettingsRow
          label={copy.nextRing}
          value={
            next
              ? `${commonCopy.dayLabel(toDayKey(next), toDayKey(now))}, ${formatClockTime(next)}`
              : copy.nothingSet
          }
        />
        <SettingsRow
          label={copy.exact}
          detail={copy.exactDetail}
          value={yesOr(status?.exact)}
          onPress={status?.exact === false ? () => void auroraBridge.openExactAlarmSettings() : undefined}
        />
        {ANDROID_VERSION >= 34 ? (
          <SettingsRow
            label={copy.fullScreen}
            detail={copy.fullScreenDetail}
            value={yesOr(status?.fullScreen)}
            onPress={
              status?.fullScreen === false
                ? () => void auroraBridge.openFullScreenIntentSettings()
                : undefined
            }
          />
        ) : null}
        <SettingsRow
          label={copy.notifications}
          detail={copy.notificationsDetail}
          value={yesOr(status?.notifications)}
          onPress={status?.notifications === false ? () => void allowNotifications() : undefined}
        />
      </SettingsGroup>
      {IS_DEV_MODE_AVAILABLE ? (
        <View style={styles.test}>
          <Button label={copy.test} variant="secondary" size="compact" onPress={() => void runTest()} />
          {testNote ? <Txt variant="caption">{testNote}</Txt> : null}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  block: { marginTop: theme.space.lg },
  test: { gap: theme.space.xs, marginTop: theme.space.md },
}));
