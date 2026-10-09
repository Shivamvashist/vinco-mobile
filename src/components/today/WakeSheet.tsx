import { useState } from 'react';
import { View } from 'react-native';

import { commonCopy, todayCopy } from '@/copy';
import { sleepMinutesBetween, validateWake } from '@/features/sleep';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { TimeField } from '../TimeField';
import { Txt } from '../Txt';

export type WakeSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Editing times already logged, rather than reporting for the first time today. */
  isEditing: boolean;
  /** Starting values, in minutes after midnight. */
  initialWakeMinutes: number;
  initialBedtimeMinutes: number;
  /** The clock now, or null when today isn't the real day (dev clock): no future check then. */
  nowMinutes: number | null;
  /** Saves both times. Only called with times that pass validation. */
  onSave: (wakeMinutes: number, bedtimeMinutes: number) => void;
};

const copy = todayCopy.wakeSheet;

/**
 * "Report for duty": when you woke (now, by default) and when you went to sleep (last
 * night's bedtime, by default). Both editable; the hours slept update as you change them.
 */
export function WakeSheet({
  visible,
  onClose,
  isEditing,
  initialWakeMinutes,
  initialBedtimeMinutes,
  nowMinutes,
  onSave,
}: WakeSheetProps) {
  const styles = useStyles();
  const [wakeMinutes, setWakeMinutes] = useState(initialWakeMinutes);
  const [bedtimeMinutes, setBedtimeMinutes] = useState(initialBedtimeMinutes);
  const [wasVisible, setWasVisible] = useState(visible);

  // Start from fresh defaults each time the sheet opens (adjusting state during render).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setWakeMinutes(initialWakeMinutes);
      setBedtimeMinutes(initialBedtimeMinutes);
    }
  }

  const error = validateWake(bedtimeMinutes, wakeMinutes, nowMinutes);
  const slept = sleepMinutesBetween(bedtimeMinutes, wakeMinutes);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={isEditing ? copy.editTitle : copy.title}>
      <View style={styles.fields}>
        <TimeField
          label={copy.wokeLabel}
          minutes={wakeMinutes}
          onChange={setWakeMinutes}
          accessibilityHint={copy.pickerHint}
        />
        <TimeField
          label={copy.sleptLabel}
          minutes={bedtimeMinutes}
          onChange={setBedtimeMinutes}
          accessibilityHint={copy.pickerHint}
        />
      </View>
      <Txt
        variant="body"
        color={error ? 'danger' : 'accent'}
        style={styles.summary}
        accessibilityLiveRegion="polite"
        accessibilityRole={error ? 'alert' : undefined}
      >
        {error ? copy.errors[error] : copy.sleepLine(commonCopy.duration(slept))}
      </Txt>
      <View style={styles.actions}>
        <Button
          label={isEditing ? copy.saveEdit : copy.save}
          cue={isEditing ? 'confirm' : 'rise'}
          disabled={error != null}
          onPress={() => onSave(wakeMinutes, bedtimeMinutes)}
        />
        <Button label={copy.cancel} variant="ghost" cue={null} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  fields: { gap: theme.space.md, marginTop: theme.space.md },
  summary: { marginTop: theme.space.lg },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
