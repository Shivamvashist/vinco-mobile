import { Pressable, View } from 'react-native';

import { todayCopy } from '@/copy';
import type { DayTaskSummary } from '@/features/tasks';
import { createStyles, useTheme } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type TodoTileProps = {
  summary: DayTaskSummary;
  onPress: () => void;
};

/** Today's to-do at a glance ("2 of 5 done · 1 to carry over"); opens the to-do list. */
export function TodoTile({ summary, onPress }: TodoTileProps) {
  const theme = useTheme();
  const styles = useStyles();
  const copy = todayCopy.todoTile;
  const status = copy.summary(summary.done, summary.total, summary.toCarryOver);
  const isAllDone = summary.total > 0 && summary.done === summary.total && summary.toCarryOver === 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}, ${status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon name={isAllDone ? 'check' : 'list'} color="accent" />
      </View>
      <View style={styles.text}>
        <Txt variant="label">{copy.title}</Txt>
        <Txt
          variant="caption"
          color={summary.toCarryOver > 0 ? 'danger' : isAllDone ? 'accent' : 'textMuted'}
        >
          {status}
        </Txt>
      </View>
      <Icon name="forward" size={theme.layout.iconSizeSmall} color="textMuted" />
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.layout.cardPadding,
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: theme.layout.iconTileSize,
    height: theme.layout.iconTileSize,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  text: { flex: 1, minWidth: 0 },
}));
