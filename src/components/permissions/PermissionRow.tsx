import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { permissionsCopy } from '@/copy';
import type { AppPermission } from '@/hooks/useAppPermissions';
import { createStyles } from '@/theme';

export type PermissionRowProps = {
  icon: IconName;
  label: string;
  why: string;
  permission: AppPermission;
  /** Shows the "Optional" tag next to the label. */
  isOptional?: boolean;
  /** The button's words. Defaults to "Allow" while the dialog can show, "Open phone settings" after. */
  actionLabel?: string;
  actionHint?: string;
  /** Said before the button, such as the focus guard's disclosure. */
  children?: ReactNode;
  /** Said under the button while the permission is off. */
  note?: string;
};

const copy = permissionsCopy;

/**
 * One permission: what it is, why Vinco wants it, whether it is on, and the way to turn it on
 * (the phone's dialog while it can still show, otherwise the right settings page).
 */
export function PermissionRow({
  icon,
  label,
  why,
  permission,
  isOptional = false,
  actionLabel,
  actionHint,
  children,
  note,
}: PermissionRowProps) {
  const styles = useStyles();
  const { status } = permission;
  const isGranted = status === 'granted';
  const isOff = status === 'denied' || status === 'undetermined';
  const buttonLabel = actionLabel ?? (permission.canAsk ? copy.allow : copy.openSettings);

  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Icon name={icon} color={isGranted ? 'accent' : 'textMuted'} />
        <View style={styles.title}>
          <Txt variant="label">{label}</Txt>
          {isOptional ? <Txt variant="caption">{copy.optional}</Txt> : null}
        </View>
        <Txt variant="caption" color={isGranted ? 'accent' : 'textMuted'}>
          {copy.status[status]}
        </Txt>
      </View>
      <Txt variant="caption">{why}</Txt>
      {children}
      {isOff ? (
        <View style={styles.action}>
          <Button
            label={buttonLabel}
            accessibilityLabel={copy.actionAccessibilityLabel(buttonLabel, label)}
            accessibilityHint={actionHint}
            size="compact"
            variant="secondary"
            onPress={() => void permission.request()}
          />
          {note ? <Txt variant="caption">{note}</Txt> : null}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    padding: theme.layout.cardPadding,
    gap: theme.space.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  title: { flex: 1 },
  action: { marginTop: theme.space.sm, gap: theme.space.xs },
}));
