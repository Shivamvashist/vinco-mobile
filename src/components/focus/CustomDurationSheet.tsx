import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { parseCustomMinutes, splitHoursMinutes } from '@/features/focus';
import { createStyles } from '@/theme';

export type CustomDurationSheetProps = {
  visible: boolean;
  /** Prefills the fields when the sheet opens. */
  initialMinutes: number;
  onClose: () => void;
  /** A valid length, any whole minute from 5 to 180. */
  onSet: (minutes: number) => void;
};

const copy = focusCopy.custom;

/** A focus length typed in: hours and minutes, any whole minute from 5 minutes to 3 hours. */
export function CustomDurationSheet({ visible, initialMinutes, onClose, onSet }: CustomDurationSheetProps) {
  const styles = useStyles();
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [wasVisible, setWasVisible] = useState(false);
  const [showError, setShowError] = useState(false);

  // Prefill each time the sheet opens (adjusting state during render, not in an effect).
  if (visible && !wasVisible) {
    const split = splitHoursMinutes(initialMinutes);
    setHours(String(split.hours));
    setMinutes(String(split.minutes));
    setShowError(false);
    setWasVisible(true);
  } else if (!visible && wasVisible) {
    setWasVisible(false);
  }

  const parsed = parseCustomMinutes(hours, minutes);

  const handleSet = () => {
    if (parsed == null) {
      setShowError(true);
      return;
    }
    onSet(parsed);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <View style={styles.body}>
        <View style={styles.fields}>
          <View style={styles.field}>
            <TextField
              label={copy.hours}
              value={hours}
              onChangeText={(text) => setHours(text.replace(/\D/g, '').slice(0, 1))}
              keyboardType="number-pad"
              maxLength={1}
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <TextField
              label={copy.minutes}
              value={minutes}
              onChangeText={(text) => setMinutes(text.replace(/\D/g, '').slice(0, 3))}
              keyboardType="number-pad"
              maxLength={3}
              returnKeyType="done"
              onSubmitEditing={handleSet}
            />
          </View>
        </View>
        <Txt
          variant="caption"
          color={showError && parsed == null ? 'danger' : 'textMuted'}
          accessibilityLiveRegion="polite"
        >
          {showError && parsed == null ? copy.invalid : copy.hint}
        </Txt>
        <Button label={copy.set} onPress={handleSet} cue="select" />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  body: { gap: theme.space.md },
  fields: { flexDirection: 'row', gap: theme.space.md },
  field: { flex: 1 },
}));
