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

export type AddTaskSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Saves the task. Returns null when saved, or why it was refused. */
  onSave: (title: string, when: TaskWhen) => TaskError | 'failed' | null;
};

const WHEN_OPTIONS: TaskWhen[] = ['today', 'tomorrow', 'daily'];

/**
 * Adds a task: what, and when (today, tomorrow or every day of the arc). Stays open after
 * each save (the field clears), so several can be added in a row; "Done" closes it.
 */
export function AddTaskSheet({ visible, onClose, onSave }: AddTaskSheetProps) {
  const styles = useStyles();
  const play = useFeedback();
  const copy = tasksCopy.add;
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState<TaskWhen>('today');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setTitle('');
    setWhen('today');
    setError(null);
    onClose();
  };

  const save = () => {
    const result = onSave(title, when);
    if (result === null) {
      play('confirm');
      setTitle('');
      setError(null);
      return;
    }
    play('denied');
    setError(result === 'failed' ? copy.failed : copy.errors[result]);
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={copy.title}>
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
        onSubmitEditing={save}
      />
      <Txt variant="caption" style={styles.whenLabel}>
        {copy.whenLabel}
      </Txt>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {WHEN_OPTIONS.map((option) => (
          <ChoiceChip
            key={option}
            label={copy.when[option]}
            selected={when === option}
            onPress={() => setWhen(option)}
          />
        ))}
      </View>
      <Txt variant="caption" style={styles.hint}>
        {copy.whenHint[when]}
      </Txt>
      {error ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.hint}>
          {error}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button label={copy.save} cue={null} onPress={save} />
        <Button label={copy.done} variant="ghost" cue={null} onPress={close} />
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
