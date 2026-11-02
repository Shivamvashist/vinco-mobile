import { View } from 'react-native';

import { auroraCopy } from '@/copy';
import type { StepPermission } from '@/hooks/useStepPermission';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Txt } from '../Txt';

const copy = auroraCopy.status;

/**
 * Under the missions when March is picked and the step counter isn't allowed yet: one plain line
 * why, and the button to allow it (or the settings page once Android stops asking).
 */
export function StepPermissionNote({ permission }: { permission: StepPermission }) {
  const styles = useStyles();
  if (permission.state === 'granted' || permission.state === 'unknown') return null;
  if (permission.state === 'unavailable') {
    return (
      <Txt variant="caption" style={styles.block}>
        {copy.noStepCounter}
      </Txt>
    );
  }
  return (
    <View style={[styles.block, styles.gap]}>
      <Txt variant="caption">{copy.stepCounterWhy}</Txt>
      <Button
        label={permission.state === 'blocked' ? copy.openSettings : copy.allowSteps}
        variant="secondary"
        size="compact"
        onPress={() => void permission.request()}
      />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  block: { marginTop: theme.space.sm },
  gap: { gap: theme.space.xs },
}));
