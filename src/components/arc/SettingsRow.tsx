import { Pressable, Switch, View } from 'react-native';

import { createStyles, useFeedback, useTheme } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';

type SettingsRowBase = {
  label: string;
  /** Draws the divider above; false for the first row. */
  hasDivider?: boolean;
};

export type SettingsRowProps = SettingsRowBase &
  (
    | {
        /** A value on the right; pressable if onPress is given. */ value: string;
        onPress?: () => void;
        toggle?: never;
      }
    | { toggle: { value: boolean; onChange: (value: boolean) => void }; value?: never; onPress?: never }
  );

/** One row in Vici's settings card: a label with a value (and chevron), or a switch. */
export function SettingsRow(props: SettingsRowProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const { label, hasDivider = true } = props;
  const rowStyle = [styles.row, hasDivider && styles.divider];

  if (props.toggle) {
    const { value, onChange } = props.toggle;
    return (
      <View style={rowStyle}>
        <Txt variant="body" style={styles.label}>
          {label}
        </Txt>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={(next) => {
            play('toggle');
            onChange(next);
          }}
          trackColor={{ false: theme.colors.border, true: theme.colors.accentBorder }}
          thumbColor={value ? theme.colors.accent : theme.colors.textMuted}
        />
      </View>
    );
  }

  const { value, onPress } = props;
  const content = (
    <>
      <Txt variant="body" style={styles.label}>
        {label}
      </Txt>
      <Txt variant="body" color="textMuted" numberOfLines={1} style={styles.value}>
        {value}
      </Txt>
      {onPress ? <Icon name="forward" size={theme.layout.iconSizeSmall} color="textMuted" /> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={rowStyle} accessible accessibilityLabel={`${label}, ${value}`}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      onPress={onPress}
      style={({ pressed }) => [...rowStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: theme.layout.buttonHeight,
    paddingHorizontal: theme.space.lg,
  },
  divider: { borderTopWidth: theme.layout.hairline, borderTopColor: theme.colors.border },
  label: { flex: 1 },
  value: { flexShrink: 1, textAlign: 'right' },
  pressed: { backgroundColor: theme.colors.surfaceRaised },
}));
