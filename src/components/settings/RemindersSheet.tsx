import { Fragment } from 'react';
import { Linking, ScrollView, useWindowDimensions, View } from 'react-native';

import { notificationsCopy } from '@/copy';
import type { ReminderKind, ReminderSettings } from '@/features/notifications';
import type { NotificationPermission } from '@/notifications';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { TimeField } from '../TimeField';
import { Txt } from '../Txt';
import { SettingsRow } from './SettingsRow';

const copy = notificationsCopy.settings;

/** The kinds in the order the user meets them in a day. */
const KIND_ORDER: readonly ReminderKind[] = ['morning', 'truceWindow', 'evening', 'lastCall'];

/** The sheet's body scrolls past this share of the window, so it fits small phones. */
const MAX_BODY_SHARE = 0.62;

export type RemindersSheetProps = {
  visible: boolean;
  onClose: () => void;
  settings: ReminderSettings;
  /** Null while it is being read. */
  permission: NotificationPermission | null;
  /** Turning on asks for the permission first. */
  onToggleOn: (isOn: boolean) => void;
  onToggleKind: (kind: ReminderKind, isOn: boolean) => void;
  onEveningChange: (minutes: number) => void;
};

/**
 * Reminders: the master switch, each kind on or off, and the evening time. When the phone has
 * refused notifications, a line says so and opens the phone's settings.
 */
export function RemindersSheet({
  visible,
  onClose,
  settings,
  permission,
  onToggleOn,
  onToggleKind,
  onEveningChange,
}: RemindersSheetProps) {
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const isRefused = permission != null && permission.status === 'denied';

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <ScrollView style={{ maxHeight: height * MAX_BODY_SHARE }} contentContainerStyle={styles.body}>
        <Txt variant="body" color="textMuted">
          {copy.intro}
        </Txt>

        {isRefused ? (
          <View style={styles.refused} accessibilityRole="alert">
            <Txt variant="caption" color="danger">
              {copy.denied}
            </Txt>
            <Button
              label={copy.openSettings}
              size="compact"
              variant="secondary"
              onPress={() => void Linking.openSettings()}
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <SettingsRow
            label={copy.master}
            detail={copy.masterDetail}
            toggle={{ value: settings.isOn && !isRefused, onChange: onToggleOn }}
          />
        </View>

        {settings.isOn && !isRefused ? (
          <>
            <View style={styles.card}>
              {KIND_ORDER.map((kind, index) => (
                <Fragment key={kind}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <SettingsRow
                    label={copy.kinds[kind].label}
                    detail={copy.kinds[kind].detail}
                    toggle={{ value: settings.kinds[kind], onChange: (next) => onToggleKind(kind, next) }}
                  />
                </Fragment>
              ))}
            </View>
            {settings.kinds.evening ? (
              <View style={styles.time}>
                <TimeField
                  label={copy.eveningTime}
                  minutes={settings.eveningMinutes}
                  onChange={onEveningChange}
                  accessibilityHint={copy.eveningHint}
                />
                <Txt variant="caption">{copy.eveningHint}</Txt>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
      <View style={styles.actions}>
        <Button label={copy.done} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  body: { gap: theme.space.md, paddingBottom: theme.space.sm },
  refused: { gap: theme.space.sm },
  card: {
    overflow: 'hidden',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunk,
  },
  divider: { height: theme.layout.hairline, backgroundColor: theme.colors.border },
  time: { gap: theme.space.xs },
  actions: { marginTop: theme.space.md },
}));
