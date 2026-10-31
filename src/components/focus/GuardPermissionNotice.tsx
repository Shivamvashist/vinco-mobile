import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import type { FocusGuard } from '@/features/focus';
import type { GuardPermissions } from '@/hooks/useGuardPermissions';
import { createStyles, useTheme } from '@/theme';

export type GuardPermissionNoticeProps = {
  guard: FocusGuard;
  permissions: GuardPermissions;
};

const copy = focusCopy.permission;

/**
 * What the guard needs before it can block, said before the user is sent to the phone's settings
 * (Google Play requires this prominent disclosure for the accessibility service): what is watched,
 * what it does, that nothing leaves the phone, then a clear button. A focus still runs without it
 * (timer and reward), and the notice says blocking is off. In Expo Go: blocking arrives later.
 */
export function GuardPermissionNotice({ guard, permissions }: GuardPermissionNoticeProps) {
  const theme = useTheme();
  const styles = useStyles();

  if (!permissions.isSupported) {
    return (
      <View style={styles.quiet}>
        <Icon name="lock" color="textMuted" size={theme.layout.iconSizeSmall} />
        <Txt variant="caption" style={styles.flex}>
          {focusCopy.setup.notYet}
        </Txt>
      </View>
    );
  }
  const granted = permissions.granted;
  if (granted == null) return null;

  if (!granted.accessibility) {
    return (
      <Card glow={{ color: 'accent', intensity: 0.5 }} style={styles.card} accessibilityRole="summary">
        <View style={styles.titleRow}>
          <Icon name="shield" color="accent" size={theme.layout.iconSize} />
          <Txt variant="headingSmall" accessibilityRole="header" style={styles.flex}>
            {copy.title}
          </Txt>
        </View>
        <Txt variant="body">{copy.body}</Txt>
        <Point icon="eye" text={copy.watches} />
        <Point icon="block" text={copy.acts} />
        <Point icon="lock" text={copy.stays} />
        <Button
          label={copy.open}
          accessibilityHint={copy.openHint}
          onPress={() => permissions.open('accessibility')}
          variant="secondary"
          size="compact"
        />
        <Txt variant="caption">{copy.blockingOff}</Txt>
      </Card>
    );
  }

  if (guard === 'custos' && !granted.overlay) {
    return (
      <Card glow={{ color: 'accent', intensity: 0.5 }} style={styles.card}>
        <Txt variant="label" accessibilityRole="header">
          {copy.overlayTitle}
        </Txt>
        <Txt variant="caption">{copy.overlayBody}</Txt>
        <Button
          label={copy.overlayOpen}
          onPress={() => permissions.open('overlay')}
          variant="secondary"
          size="compact"
        />
      </Card>
    );
  }
  return null;
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
  flex: { flex: 1 },
  quiet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.sm,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunk,
  },
  card: {
    gap: theme.space.sm,
    padding: theme.layout.cardPadding + theme.space.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.sm },
}));
