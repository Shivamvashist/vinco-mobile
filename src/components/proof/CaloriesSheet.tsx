import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { proofCopy } from '@/copy';
import { addCalories, CALORIE_STEPS, parseCalories } from '@/features/proof';
import { createStyles, useFeedback } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { Txt } from '../Txt';

export type CaloriesSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Today's total if already logged: prefilled, and "Clear today" is offered. */
  current: number | null;
  /** Saves today's total, or null to clear it. */
  onSave: (kcal: number | null) => void;
};

const copy = proofCopy.caloriesSheet;

/** Logs today's calories: type the total, or add quick steps to it. Optional, and neutral. */
export function CaloriesSheet({ visible, onClose, current, onSave }: CaloriesSheetProps) {
  const styles = useStyles();
  const play = useFeedback();
  const [text, setText] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [wasVisible, setWasVisible] = useState(visible);

  // Prefill each time the sheet opens (adjusting state during render).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setText(current != null ? String(current) : '');
      setIsInvalid(false);
    }
  }

  const save = () => {
    const kcal = parseCalories(text);
    if (kcal == null) {
      play('denied');
      setIsInvalid(true);
      return;
    }
    play('confirm');
    onSave(kcal);
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
          keyboardType="number-pad"
          maxLength={6}
          returnKeyType="done"
          onSubmitEditing={save}
        />
      </View>
      <View style={styles.steps}>
        {CALORIE_STEPS.map((step) => (
          <Pressable
            key={step}
            accessibilityRole="button"
            accessibilityLabel={copy.addLabel(step)}
            onPress={() => {
              play('stepUp');
              setText(String(addCalories(text, step)));
              setIsInvalid(false);
            }}
            style={({ pressed }) => [styles.step, pressed && styles.pressed]}
          >
            <Txt variant="labelSmall" color="accent">
              {copy.add(step)}
            </Txt>
          </Pressable>
        ))}
      </View>
      {isInvalid ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.error}>
          {copy.invalid}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button label={copy.save} cue={null} onPress={save} />
        {current != null ? (
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
  steps: { flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.md },
  step: {
    flex: 1,
    minHeight: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
  },
  pressed: { opacity: 0.85 },
  error: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
