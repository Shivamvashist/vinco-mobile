import { useState } from 'react';
import { View } from 'react-native';

import { arcCopy } from '@/copy';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { Txt } from '../Txt';

export type RetreatSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Wipes the journey. Throws if it failed; the sheet then says so and stays open. */
  onConfirm: () => void;
};

/**
 * "Sound the retreat": resets the journey. The user types a word first, so a stray
 * tap can never wipe an arc. Holding the line (cancel) is the easy, default way out.
 */
export function RetreatSheet({ visible, onClose, onConfirm }: RetreatSheetProps) {
  const styles = useStyles();
  const copy = arcCopy.retreat;
  const [typed, setTyped] = useState('');
  const [hasFailed, setHasFailed] = useState(false);
  const isConfirmed = typed.trim().toUpperCase() === copy.word;

  const close = () => {
    setTyped('');
    setHasFailed(false);
    onClose();
  };

  const confirm = () => {
    if (!isConfirmed) return;
    try {
      onConfirm();
    } catch (error) {
      if (__DEV__) console.warn('[retreat] Reset failed.', error);
      setHasFailed(true);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={copy.title}>
      <Txt variant="body" color="textMuted">
        {copy.body}
      </Txt>
      <View style={styles.field}>
        <TextField
          label={copy.fieldLabel(copy.word)}
          value={typed}
          onChangeText={(text) => {
            setTyped(text);
            setHasFailed(false);
          }}
          placeholder={copy.word}
          autoCapitalize="characters"
          maxLength={copy.word.length + 4}
          returnKeyType="done"
          onSubmitEditing={confirm}
        />
      </View>
      {hasFailed ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.error}>
          {copy.failed}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button
          label={copy.confirm}
          variant="danger"
          cue="denied"
          disabled={!isConfirmed}
          onPress={confirm}
        />
        <Button label={copy.cancel} variant="ghost" cue={null} onPress={close} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  field: { marginTop: theme.space.lg },
  error: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
