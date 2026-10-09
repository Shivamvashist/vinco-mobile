import { Pressable, View } from 'react-native';

import type { OrderStatus } from '@/features/orders';
import { createStyles } from '@/theme';

import { ProgressBar } from '../ProgressBar';
import { StatusCircle } from '../StatusCircle';
import { Txt } from '../Txt';

export type TaskRowProps = {
  name: string;
  /** Progress line under the name: "2 of 4 L · minimum held". */
  line: string;
  status: OrderStatus;
  /** Inline action on the right ("+1 L", "Log"). Hidden once the order is conquered. */
  action?: string;
  /** Segmented bar under the line, for water. */
  segments?: { total: number; filled: number };
  onPress: () => void;
  /** Undo one step. */
  onLongPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
};

/**
 * One order on Today: status circle, name, progress line, optional bar, inline action.
 * Tap to add, long-press to undo. The whole row is one button for screen readers.
 */
export function TaskRow({
  name,
  line,
  status,
  action,
  segments,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
}: TaskRowProps) {
  const styles = useStyles();
  const isHeld = status !== 'none';
  const isConquered = status === 'full';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, isConquered && styles.rowConquered, pressed && styles.pressed]}
    >
      <StatusCircle status={status} />
      <View style={styles.text}>
        <Txt variant="label" numberOfLines={1}>
          {name}
        </Txt>
        <Txt variant="caption" color={isHeld ? 'accent' : 'textMuted'} numberOfLines={1} style={styles.line}>
          {line}
        </Txt>
        {segments ? (
          <View style={styles.bar}>
            <ProgressBar segments={segments} />
          </View>
        ) : null}
      </View>
      {action && !isConquered ? (
        <Txt variant="labelSmall" color="accent" numberOfLines={1}>
          {action}
        </Txt>
      ) : null}
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.layout.cardPadding,
    padding: theme.layout.cardPadding,
    minHeight: theme.layout.buttonHeight + theme.space.lg,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSunk,
  },
  rowConquered: { borderColor: theme.colors.accentBorder },
  pressed: { opacity: 0.85 },
  text: { flex: 1, minWidth: 0 },
  line: { marginTop: theme.space.xxs },
  bar: { marginTop: theme.space.sm },
}));
