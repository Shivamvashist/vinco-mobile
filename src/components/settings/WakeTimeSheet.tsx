import { useState } from 'react';
import { View } from 'react-native';

import { settingsCopy } from '@/copy';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { TimeField } from '../TimeField';
import { Txt } from '../Txt';

const copy = settingsCopy.sheets.wakeTime;

export type WakeTimeSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The current planned time, minutes after midnight. */
  minutes: number;
  /** Saves the new time. Returns false when it could not be saved. */
  onSave: (minutes: number) => boolean;
};

/** Changes the planned wake-up time: the time that conquers the wake-up order. */
export function WakeTimeSheet({ visible, onClose, minutes, onSave }: WakeTimeSheetProps) {
  const styles = useStyles();
  // Null until the user picks a time, so the sheet always opens on the saved one.
  const [picked, setPicked] = useState<number | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const value = picked ?? minutes;

  const close = () => {
    setPicked(null);
    setHasFailed(false);
    onClose();
  };

  const save = () => {
    if (!onSave(value)) {
      setHasFailed(true);
      return;
    }
    close();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={copy.title}>
      <Txt variant="body" color="textMuted">
        {copy.body}
      </Txt>
      <View style={styles.field}>
        <TimeField label={copy.field} minutes={value} onChange={setPicked} />
      </View>
      {hasFailed ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert">
          {copy.saveFailed}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button label={copy.save} cue="confirm" onPress={save} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  field: { marginTop: theme.space.lg },
  actions: { marginTop: theme.space.lg },
}));
