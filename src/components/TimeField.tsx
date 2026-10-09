import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, View } from 'react-native';

import { formatClockMinutes } from '@/lib/dates';
import { createStyles, useFeedback } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

export type TimeFieldProps = {
  /** Shown above the value and read by screen readers. */
  label: string;
  /** Minutes after midnight. */
  minutes: number;
  onChange: (minutes: number) => void;
  /** Hint read after the label, for example "Opens the clock". */
  accessibilityHint?: string;
};

/** A Date at today's date and the given clock time: the picker's starting value. */
function toPickerDate(minutes: number): Date {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

/**
 * A clock time the user can change: the value as a big, tappable field. On Android it opens the
 * system clock dialog; elsewhere the inline picker shows under the label. Dismissing changes nothing.
 */
export function TimeField({ label, minutes, onChange, accessibilityHint }: TimeFieldProps) {
  const styles = useStyles();
  const play = useFeedback();

  const pick = (date: Date | undefined) => {
    if (!date || Number.isNaN(date.getTime())) return;
    onChange(date.getHours() * 60 + date.getMinutes());
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.wrap}>
        <Txt variant="caption">{label}</Txt>
        <DateTimePicker
          value={toPickerDate(minutes)}
          mode="time"
          display="compact"
          accessibilityLabel={label}
          onValueChange={(_event, date) => pick(date)}
        />
      </View>
    );
  }

  const open = () => {
    play('tap');
    DateTimePickerAndroid.open({
      value: toPickerDate(minutes),
      mode: 'time',
      is24Hour: false,
      // Fires only when a time is set; dismissing the dialog changes nothing.
      onValueChange: (_event, date) => pick(date),
    });
  };

  return (
    <View style={styles.wrap}>
      <Txt variant="caption">{label}</Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${formatClockMinutes(minutes)}`}
        accessibilityHint={accessibilityHint}
        onPress={open}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <Txt variant="heading">{formatClockMinutes(minutes)}</Txt>
        <Icon name="forward" color="textMuted" />
      </Pressable>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: theme.layout.buttonHeight,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.sm,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  pressed: { opacity: 0.7 },
}));
