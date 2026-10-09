import { View } from 'react-native';

import { commonCopy, tasksCopy } from '@/copy';
import type { Task } from '@/features/tasks';
import type { DayKey } from '@/lib/dates';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Txt } from '../Txt';

export type CarryOverCardProps = {
  tasks: readonly Task[];
  today: DayKey;
  onResolve: (taskIds: readonly number[], choice: 'carry' | 'drop') => void;
};

/**
 * "Carry over or drop?": day tasks left unfinished on earlier days. Nothing moves without
 * the user's say. One by one, or all at once when there are several.
 */
export function CarryOverCard({ tasks, today, onResolve }: CarryOverCardProps) {
  const styles = useStyles();
  const copy = tasksCopy.carryOver;
  const ids = tasks.map((task) => task.id);

  return (
    <View style={styles.card}>
      <Txt variant="label" color="danger" accessibilityRole="header">
        {copy.title(tasks.length)}
      </Txt>
      <Txt variant="caption" style={styles.body}>
        {copy.body}
      </Txt>
      {tasks.map((task) => (
        <View key={task.id} style={styles.item}>
          <View style={styles.itemText}>
            <Txt variant="body" numberOfLines={2}>
              {task.title}
            </Txt>
            <Txt variant="caption">{copy.from(commonCopy.dayLabel(task.carriedFrom ?? task.day, today))}</Txt>
          </View>
          <View style={styles.itemActions}>
            <Button
              label={copy.drop}
              variant="ghost"
              size="compact"
              cue="stepDown"
              onPress={() => onResolve([task.id], 'drop')}
            />
            <Button
              label={copy.carry}
              variant="secondary"
              size="compact"
              onPress={() => onResolve([task.id], 'carry')}
            />
          </View>
        </View>
      ))}
      {tasks.length > 1 ? (
        <View style={styles.allActions}>
          <Button label={copy.carryAll} size="compact" onPress={() => onResolve(ids, 'carry')} />
          <Button
            label={copy.dropAll}
            variant="ghost"
            size="compact"
            cue="stepDown"
            onPress={() => onResolve(ids, 'drop')}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.dangerBorder,
    backgroundColor: theme.colors.dangerSoft,
  },
  body: { marginTop: theme.space.xs },
  item: {
    marginTop: theme.space.md,
    paddingTop: theme.space.md,
    borderTopWidth: theme.layout.borderWidth,
    borderTopColor: theme.colors.border,
    gap: theme.space.sm,
  },
  itemText: { gap: theme.space.xxs },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.space.sm },
  allActions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
