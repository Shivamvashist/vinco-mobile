import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { SectionHeader } from '@/components/SectionHeader';
import { Txt } from '@/components/Txt';
import { auroraCopy, focusCopy, permissionsCopy } from '@/copy';
import type { AppPermissions } from '@/hooks/useAppPermissions';
import { createStyles, useTheme } from '@/theme';

import { PermissionRow } from './PermissionRow';

export type PermissionListProps = {
  /** From `useAppPermissions()`, read by the screen. */
  permissions: AppPermissions;
};

const copy = permissionsCopy;
const disclosure = focusCopy.permission;

/**
 * Every permission Vinco uses, in three groups: the daily ones (reminders, camera, microphone),
 * Aurora's alarm access and the focus guard (optional). The native groups say they arrive with
 * the Vinco build where this build can't use them (Expo Go). Used by onboarding and Permissions.
 */
export function PermissionList({ permissions }: PermissionListProps) {
  const styles = useStyles();
  const { items } = permissions;
  const isAlarmBuilt = items.exactAlarm.status !== 'unsupported';
  const isGuardBuilt = items.accessibility.status !== 'unsupported';

  return (
    <View style={styles.list}>
      <Group title={copy.groups.daily}>
        <PermissionRow
          icon="bell"
          label={copy.items.notifications.label}
          why={copy.items.notifications.why}
          permission={items.notifications}
        />
        <PermissionRow
          icon="camera"
          label={copy.items.camera.label}
          why={copy.items.camera.why}
          permission={items.camera}
        />
        <PermissionRow
          icon="mic"
          label={copy.items.microphone.label}
          why={copy.items.microphone.why}
          permission={items.microphone}
        />
      </Group>

      <Group title={copy.groups.alarm}>
        {isAlarmBuilt ? (
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
          <VincoBuildNote />
        )}
      </Group>

      <Group title={copy.groups.guard}>
        {isGuardBuilt ? (
          <>
            <PermissionRow
              icon="shield"
              label={copy.items.accessibility.label}
              why={disclosure.body}
              permission={items.accessibility}
              isOptional
              actionLabel={disclosure.open}
              actionHint={disclosure.openHint}
              note={disclosure.blockingOff}
            >
              {/* Google Play's prominent disclosure: said before the settings page opens. */}
              <Point icon="eye" text={disclosure.watches} />
              <Point icon="block" text={disclosure.acts} />
              <Point icon="lock" text={disclosure.stays} />
            </PermissionRow>
            <PermissionRow
              icon="eye"
              label={copy.items.overlay.label}
              why={copy.items.overlay.why}
              permission={items.overlay}
              isOptional
              actionLabel={disclosure.overlayOpen}
            />
          </>
        ) : (
          <VincoBuildNote />
        )}
      </Group>
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View>
      <SectionHeader title={title} />
      <View style={styles.rows}>{children}</View>
    </View>
  );
}

function VincoBuildNote() {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.quiet}>
      <Icon name="lock" color="textMuted" size={theme.layout.iconSizeSmall} />
      <Txt variant="caption" style={styles.flex}>
        {copy.vincoBuild}
      </Txt>
    </View>
  );
}

function Point({ icon, text }: { icon: IconName; text: string }) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.point}>
      <Icon name={icon} color="textMuted" size={theme.layout.iconSizeSmall} />
      <Txt variant="caption" color="text" style={styles.flex}>
        {text}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  list: { gap: theme.space.lg },
  rows: { gap: theme.space.sm },
  flex: { flex: 1 },
  quiet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.sm,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunk,
  },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.sm },
}));
