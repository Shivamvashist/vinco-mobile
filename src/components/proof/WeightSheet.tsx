import { useState } from 'react';
import { View } from 'react-native';

import { proofCopy } from '@/copy';
import { parseWeightKg } from '@/features/proof';
import { createStyles, useFeedback } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { Txt } from '../Txt';

export type WeightSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Today's weight if already logged: prefilled, and "Clear today" is offered. */
  currentKg: number | null;
  /** Saves today's weight, or null to clear it. */
  onSave: (kg: number | null) => void;
};

const copy = proofCopy.weightSheet;

/** Logs today's body weight. Neutral in every tone: no comments, just the number. */
export function WeightSheet({ visible, onClose, currentKg, onSave }: WeightSheetProps) {
  const styles = useStyles();
  const play = useFeedback();
  const [text, setText] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [wasVisible, setWasVisible] = useState(visible);

  // Prefill each time the sheet opens (adjusting state during render).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setText(currentKg != null ? proofCopy.kg(currentKg) : '');
      setIsInvalid(false);
    }
  }

  const save = () => {
    const kg = parseWeightKg(text);
    if (kg == null) {
      play('denied');
      setIsInvalid(true);
      return;
    }
    play('confirm');
    onSave(kg);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <Txt variant="caption">{copy.body}</Txt>
      <View style={styles.field}>
        <TextField
          label={copy.label}
          value={text}
          onChangeText={(next) => {
            setText(next);
            setIsInvalid(false);
          }}
          placeholder={copy.placeholder}
          keyboardType="decimal-pad"
          maxLength={6}
          returnKeyType="done"
          onSubmitEditing={save}
        />
      </View>
      {isInvalid ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.error}>
          {proofCopy.daily.weightInvalid}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button label={copy.save} cue={null} onPress={save} />
        {currentKg != null ? (
          <Button
            label={copy.clear}
            variant="secondary"
            size="compact"
            cue="stepDown"
            onPress={() => onSave(null)}
          />
        ) : null}
        <Button label={copy.cancel} variant="ghost" cue={null} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  field: { marginTop: theme.space.lg },
  error: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
