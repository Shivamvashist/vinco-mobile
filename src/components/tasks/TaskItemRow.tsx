import { Pressable, View } from 'react-native';

import { tasksCopy } from '@/copy';
import { createStyles } from '@/theme';

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
  onRemove: () => void;
};

/**
 * One task: a check circle and title (tap to tick), and a remove button. Simpler than an
 * order row on purpose: a task is done or not, with no minimum.
 */
export function TaskItemRow({ title, isDone, note, canTick, onToggle, onRemove }: TaskItemRowProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone, disabled: !canTick }}
        accessibilityLabel={tasksCopy.checkLabel(title, isDone)}
        disabled={!canTick}
        onPress={onToggle}
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
      <IconButton
        icon="close"
        color="textMuted"
        accessibilityLabel={tasksCopy.remove(title)}
        cue="stepDown"
        onPress={onRemove}
      />
    </View>
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
