import { Pressable, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { createStyles, useFeedback, useReduceMotion, useTheme } from '@/theme';

import { Icon, type IconName } from '../Icon';
import { Txt } from '../Txt';

export type QuickLog = {
  key: string;
  icon: IconName;
  /** "Selfie" while pending; "Selfie taken", "72.4 kg" once done. */
  label: string;
  isDone: boolean;
  hint: string;
  onPress: () => void;
};

export type QuickLogsProps = { logs: readonly QuickLog[] };

const MOVE = LinearTransition.duration(220);

/**
 * The day's quick logs under the header (selfie, weight, calories). Each stands out as a gold
 * pill until it's done today, then shrinks to a small checked circle at the end of the row.
 */
export function QuickLogs({ logs }: QuickLogsProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const reduceMotion = useReduceMotion();
  const ordered = [...logs.filter((log) => !log.isDone), ...logs.filter((log) => log.isDone)];
  const hasPending = ordered.some((log) => !log.isDone);

  return (
    <View style={[styles.row, !hasPending && styles.rowAllDone]}>
      {ordered.map((log) => (
        <Animated.View
          key={log.key}
          layout={reduceMotion ? undefined : MOVE}
          style={log.isDone ? null : styles.pendingSlot}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={log.label}
            accessibilityHint={log.hint}
            onPress={() => {
              play('tap');
              log.onPress();
            }}
            style={({ pressed }) => [log.isDone ? styles.done : styles.pending, pressed && styles.pressed]}
          >
            <Icon
              name={log.icon}
              size={log.isDone ? theme.layout.iconSizeSmall : theme.layout.iconSize}
              color={log.isDone ? 'textMuted' : 'accent'}
            />
            {log.isDone ? (
              <View style={styles.badge}>
                <Icon name="check" size={theme.space.md} color="onAccent" strokeWidth={2.4} />
              </View>
            ) : (
              <Txt variant="labelSmall" numberOfLines={1} style={styles.pendingLabel}>
                {log.label}
              </Txt>
            )}
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, marginTop: theme.space.lg },
  rowAllDone: { justifyContent: 'flex-end' },
  pendingSlot: { flex: 1, minWidth: 0 },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.xs,
    minHeight: theme.layout.buttonHeightCompact,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
  },
  pendingLabel: { flexShrink: 1 },
  done: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
  },
  badge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: theme.space.lg,
    height: theme.space.lg,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  pressed: { opacity: 0.8 },
}));
