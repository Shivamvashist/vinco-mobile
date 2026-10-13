import { useState } from 'react';
import { View } from 'react-native';

import { tasksCopy } from '@/copy';
import { TASK_LIMITS, type TaskError, type TaskWhen } from '@/features/tasks';
import { createStyles, useFeedback } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { ChoiceChip } from '../ChoiceChip';
import { TextField } from '../TextField';
import { Txt } from '../Txt';

/** How often a new or edited item comes, or that it should become an order. */
export type TaskChoice = TaskWhen | 'order';

const CHOICES: TaskChoice[] = ['today', 'tomorrow', 'daily', 'order'];

export type TaskSheetProps = {
  visible: boolean;
  /** add: stays open after each save, for several in a row. edit: closes on save. */
  mode: 'add' | 'edit';
  initialTitle?: string;
  initialWhen?: TaskWhen;
  /** False when there is no room for another own order (or no arc): the choice explains why. */
  canMakeOrder: boolean;
  maxOrders: number;
  onClose: () => void;
  /** Saves the task. Returns null when saved, or why it was refused. */
  onSave: (title: string, when: TaskWhen) => TaskError | 'failed' | null;
  /** "An order": hands the title to the order step (minimum and full goal). */
  onChooseOrder: (title: string) => void;
  /** Edit only. */
  onRemove?: () => void;
};

/**
 * One sheet for the whole to-do system: what, and how often. Just today, tomorrow and every
 * day are tasks (a plan); "An order" goes on to set a minimum and a full goal (it decides the
 * day). The same sheet edits a task: rename it, change how often, make it an order, remove it.
 */
export function TaskSheet({
  visible,
  mode,
  initialTitle = '',
  initialWhen = 'today',
  canMakeOrder,
  maxOrders,
  onClose,
  onSave,
  onChooseOrder,
  onRemove,
}: TaskSheetProps) {
  const styles = useStyles();
  const play = useFeedback();
  const copy = tasksCopy.add;
  const [title, setTitle] = useState(initialTitle);
  const [choice, setChoice] = useState<TaskChoice>(initialWhen);
  const [error, setError] = useState<string | null>(null);
  const isOrder = choice === 'order';

  const close = () => {
    setTitle('');
    setChoice('today');
    setError(null);
    onClose();
  };

  const submit = () => {
    if (choice === 'order') {
      if (!canMakeOrder) {
        play('denied');
        setError(copy.orderFull(maxOrders));
        return;
      }
      if (title.trim().length === 0) {
        play('denied');
        setError(copy.errors.titleMissing);
        return;
      }
      const name = title.trim();
      setTitle('');
      setChoice('today');
      setError(null);
      onChooseOrder(name);
      return;
    }
    const result = onSave(title, choice);
    if (result === null) {
      play('confirm');
      setError(null);
      if (mode === 'edit') close();
      else setTitle('');
      return;
    }
    play('denied');
    setError(result === 'failed' ? copy.failed : copy.errors[result]);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={mode === 'edit' ? tasksCopy.edit.title : copy.title}
    >
      <TextField
        label={copy.label}
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          setError(null);
        }}
        placeholder={copy.placeholder}
        maxLength={TASK_LIMITS.titleMaxLength}
        autoCapitalize="sentences"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Txt variant="caption" style={styles.whenLabel}>
        {copy.whenLabel}
      </Txt>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {CHOICES.map((option) => (
          <ChoiceChip
            key={option}
            label={copy.when[option]}
            selected={choice === option}
            onPress={() => {
              setChoice(option);
              setError(null);
            }}
          />
        ))}
      </View>
      <Txt variant="caption" color={isOrder ? 'accent' : 'textMuted'} style={styles.hint}>
        {isOrder && !canMakeOrder ? copy.orderFull(maxOrders) : copy.whenHint[choice]}
      </Txt>
      {error ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.hint}>
          {error}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button
          label={
            isOrder
              ? mode === 'edit'
                ? tasksCopy.edit.makeOrder
                : copy.next
              : mode === 'edit'
                ? tasksCopy.edit.save
                : copy.save
          }
          cue={null}
          disabled={isOrder && !canMakeOrder}
          onPress={submit}
        />
        {mode === 'edit' && onRemove ? (
          <Button label={tasksCopy.edit.remove} variant="ghost" cue="stepDown" onPress={onRemove} />
        ) : (
          <Button label={copy.done} variant="ghost" cue={null} onPress={close} />
        )}
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  whenLabel: { marginTop: theme.space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.xs },
  hint: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
