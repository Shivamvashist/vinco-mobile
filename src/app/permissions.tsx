import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Linking, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { commonCopy, permissionsCopy } from '@/copy';
import { createStyles } from '@/theme';

type Status = 'granted' | 'denied' | 'undetermined' | 'checking';

const copy = permissionsCopy;

/**
 * What Vinco may use and why: camera and microphone now (allow here, or open the phone's
 * settings once refused), reminders and the reel counter later. Rechecks on return to the app.
 */
export default function PermissionsScreen() {
  const styles = useStyles();
  const [camera, requestCamera] = useCameraPermissions();
  const [microphone, setMicrophone] = useState<{ status: Status; canAskAgain: boolean }>({
    status: 'checking',
    canAskAgain: true,
  });

  const readMicrophone = () => {
    getRecordingPermissionsAsync()
      .then(({ status, canAskAgain }) => setMicrophone({ status, canAskAgain }))
      .catch(() => setMicrophone({ status: 'undetermined', canAskAgain: true }));
  };

  // Read now, and again when the user comes back from the phone's settings.
  useEffect(() => {
    readMicrophone();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') readMicrophone();
    });
    return () => subscription.remove();
  }, []);

  const cameraStatus: Status = camera ? camera.status : 'checking';
  const canAskCamera = camera ? camera.canAskAgain : false;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <IconButton
          icon="back"
          accessibilityLabel={commonCopy.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/veni'))}
        />
      </View>
      <ScreenHeader eyebrow={copy.eyebrow} title={copy.title} caption={copy.intro} />
      <View style={styles.list}>
        <PermissionRow
          icon="camera"
          label={copy.items.camera.label}
          why={copy.items.camera.why}
          status={cameraStatus}
          onAllow={canAskCamera ? () => void requestCamera() : undefined}
        />
        <PermissionRow
          icon="mic"
          label={copy.items.microphone.label}
          why={copy.items.microphone.why}
          status={microphone.status}
          onAllow={
            microphone.canAskAgain
              ? () => {
                  requestRecordingPermissionsAsync()
                    .then(({ status, canAskAgain }) => setMicrophone({ status, canAskAgain }))
                    .catch(() => undefined);
                }
              : undefined
          }
        />
        <PermissionRow
          icon="bell"
          label={copy.items.notifications.label}
          why={copy.items.notifications.why}
        />
        <PermissionRow icon="eye" label={copy.items.guard.label} why={copy.items.guard.why} />
      </View>
    </Screen>
  );
}

type PermissionRowProps = {
  icon: IconName;
  label: string;
  why: string;
  /** Omitted for permissions that arrive later. */
  status?: Status;
  /** Asks the phone. Omitted once it can no longer ask: then the phone's settings open instead. */
  onAllow?: () => void;
};

function PermissionRow({ icon, label, why, status, onAllow }: PermissionRowProps) {
  const styles = useStyles();
  const statusText = status ? copy.status[status] : copy.later;
  return (
    <View style={styles.row} accessible={false}>
      <View style={styles.head}>
        <Icon name={icon} color={status === 'granted' ? 'accent' : 'textMuted'} />
        <Txt variant="label" style={styles.label}>
          {label}
        </Txt>
        <Txt variant="caption" color={status === 'granted' ? 'accent' : 'textMuted'}>
          {statusText}
        </Txt>
      </View>
      <Txt variant="caption">{why}</Txt>
      {status && status !== 'granted' && status !== 'checking' ? (
        <View style={styles.action}>
          {onAllow ? (
            <Button label={copy.allow} size="compact" variant="secondary" onPress={onAllow} />
          ) : (
            <Button
              label={copy.openSettings}
              size="compact"
              variant="secondary"
              onPress={() => void Linking.openSettings()}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  nav: { marginLeft: -theme.space.md, marginBottom: theme.space.xs },
  list: { marginTop: theme.space.xl, gap: theme.space.sm },
  row: {
    padding: theme.layout.cardPadding,
    gap: theme.space.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  label: { flex: 1 },
  action: { marginTop: theme.space.sm },
}));
