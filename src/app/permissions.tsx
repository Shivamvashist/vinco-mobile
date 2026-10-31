import { router } from 'expo-router';
import { View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { PermissionList } from '@/components/permissions/PermissionList';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { commonCopy, permissionsCopy } from '@/copy';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { createStyles } from '@/theme';

const copy = permissionsCopy;

/**
 * What Vinco may use and why, from the user menu: the same list as onboarding (reminders,
 * camera, microphone, Aurora's alarm access, the focus guard). Rechecks on return to the app.
 */
export default function PermissionsScreen() {
  const styles = useStyles();
  const permissions = useAppPermissions();

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
        <PermissionList permissions={permissions} />
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  nav: { marginLeft: -theme.space.md, marginBottom: theme.space.xs },
  list: { marginTop: theme.space.xl },
}));
