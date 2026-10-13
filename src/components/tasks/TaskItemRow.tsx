import { Pressable, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { tasksCopy } from '@/copy';
import { createStyles, useReduceMotion } from '@/theme';

import { IconButton } from '../IconButton';
import { StatusCircle } from '../StatusCircle';
import { Txt } from '../Txt';

export type TaskItemRowProps = {
  title: string;
  isDone: boolean;
  /** A small note under the title ("carried over", "Planned for tomorrow"). */
  note?: string;
  /** Tomorrow's tasks can't be ticked yet. */
  canTick: boolean;
  onToggle: () => void;
  /** A quick remove button on the right. */
  onRemove?: () => void;
  /** Long press (and, without onRemove, the button on the right) opens the task's sheet. */
  onEdit?: () => void;
};

const ROW_MOVE = LinearTransition.duration(220);

/**
 * One task: a check circle and title (tap to tick, press and hold to edit), and a remove or
 * edit button. Simpler than an order row on purpose: a task is done or not, with no minimum.
 */
export function TaskItemRow({ title, isDone, note, canTick, onToggle, onRemove, onEdit }: TaskItemRowProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  return (
    // Slides to its new place when ticking moves it to the bottom (or back up).
    <Animated.View style={styles.row} layout={reduceMotion ? undefined : ROW_MOVE}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone, disabled: !canTick }}
        accessibilityLabel={tasksCopy.checkLabel(title, isDone)}
        accessibilityHint={onEdit ? tasksCopy.edit.hint : undefined}
        accessibilityActions={onEdit ? [{ name: 'longpress', label: tasksCopy.edit.title }] : undefined}
        onAccessibilityAction={onEdit ? () => onEdit() : undefined}
        disabled={!canTick && !onEdit}
        onPress={canTick ? onToggle : onEdit}
        onLongPress={onEdit}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <StatusCircle status={isDone ? 'full' : 'none'} />
        <View style={styles.text}>
          <Txt variant="body" color={isDone ? 'textMuted' : 'text'} style={isDone && styles.done}>
            {title}
          </Txt>
          {note ? <Txt variant="caption">{note}</Txt> : null}
        </View>
      </Pressable>
      {onRemove ? (
        <IconButton
          icon="close"
          color="textMuted"
          accessibilityLabel={tasksCopy.remove(title)}
          cue="stepDown"
          onPress={onRemove}
        />
      ) : onEdit ? (
        <IconButton
          icon="edit"
          color="textMuted"
          accessibilityLabel={tasksCopy.edit.open(title)}
          onPress={onEdit}
        />
      ) : null}
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    minHeight: theme.layout.minTouchTarget,
    paddingVertical: theme.space.md,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, minWidth: 0 },
  done: { textDecorationLine: 'line-through' },
}));
