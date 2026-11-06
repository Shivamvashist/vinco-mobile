import { View } from 'react-native';

import { auroraCopy, auroraSetupCopy, permissionsCopy } from '@/copy';
import { auroraBridge } from '@/features/aurora';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { createStyles } from '@/theme';

import { PermissionRow } from '../permissions/PermissionRow';
import { Txt } from '../Txt';

const copy = auroraSetupCopy.permissions;

/**
 * The setup flow's last step: what Aurora needs from Android, each with why and the way to allow
 * it, ticked live as the user comes back from a settings page. In Expo Go only notifications
 * apply; the alarm access arrives with the Vinco build.
 */
export function AuroraSetupPermissions() {
  const styles = useStyles();
  const { items } = useAppPermissions();
  return (
    <View style={styles.list}>
      <PermissionRow
        icon="bell"
        label={auroraCopy.status.notifications}
        why={copy.notificationsWhy}
        permission={items.notifications}
      />
      {auroraBridge.isSupported ? (
        <>
          <PermissionRow
            icon="alarm"
            label={auroraCopy.status.exact}
            why={auroraCopy.status.exactDetail}
            permission={items.exactAlarm}
          />
          <PermissionRow
            icon="alarm"
            label={auroraCopy.status.fullScreen}
            why={auroraCopy.status.fullScreenDetail}
            permission={items.fullScreenAlarm}
          />
        </>
      ) : (
        <Txt variant="caption">{permissionsCopy.vincoBuild}</Txt>
      )}
      <Txt variant="caption">{copy.later}</Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  list: { gap: theme.space.sm },
}));
