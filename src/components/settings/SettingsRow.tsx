import { Pressable, Switch, View } from 'react-native';

import { createStyles, useFeedback, useTheme } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';

type SettingsRowBase = {
  label: string;
  /** A short line under the label, such as what a switch does. */
  detail?: string;
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

/**
 * One row in a settings card: a label (and optional detail) with a value and chevron, or a
 * switch. Rows sit in a SettingsGroup, which draws the lines between them.
 */
export function SettingsRow(props: SettingsRowProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const { label, detail } = props;
  const rowStyle = styles.row;
  const labelBlock = (
    <View style={styles.label}>
      <Txt variant="body">{label}</Txt>
      {detail ? <Txt variant="caption">{detail}</Txt> : null}
    </View>
  );

  if (props.toggle) {
    const { value, onChange } = props.toggle;
    return (
      <View style={rowStyle}>
        {labelBlock}
        <Switch
          accessibilityLabel={label}
          accessibilityHint={detail}
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
      {labelBlock}
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
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
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
    paddingVertical: theme.space.sm,
  },
  label: { flex: 1, gap: theme.space.xxs },
  value: { flexShrink: 1, textAlign: 'right' },
  pressed: { backgroundColor: theme.colors.surfaceRaised },
}));
