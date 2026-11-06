import { View } from 'react-native';

import { auroraCopy, guardCopy } from '@/copy';
import { type AuroraMission, isMissionBuilt } from '@/features/aurora';
import type { StepPermission } from '@/hooks/useStepPermission';
import { createStyles } from '@/theme';

import { OptionCard } from '../OptionCard';
import { StepPermissionNote } from './StepPermissionNote';

const copy = guardCopy.aurora;

export type AuroraMissionPickerProps = {
  /** The missions offered, in order. */
  missions: readonly AuroraMission[];
  selected: AuroraMission;
  onPick: (mission: AuroraMission) => void;
  /** The step counter's permission: its note shows under the list while March is picked. */
  steps: StepPermission;
};

/**
 * The missions that stop Aurora, one card each (a mission not built yet says it arrives soon),
 * and the step counter note under them while March is picked. Shared by the Aurora screen and
 * the setup flow.
 */
export function AuroraMissionPicker({ missions, selected, onPick, steps }: AuroraMissionPickerProps) {
  const styles = useStyles();
  return (
    <View>
      <View style={styles.options} accessibilityRole="radiogroup">
        {missions.map((mission) => (
          <OptionCard
            key={mission}
            title={copy.missions[mission].name}
            description={
              isMissionBuilt(mission)
                ? copy.missions[mission].does
                : `${copy.missions[mission].does} ${auroraCopy.status.soon}`
            }
            selected={selected === mission}
            onPress={() => onPick(mission)}
          />
        ))}
      </View>
      {selected === 'march' ? <StepPermissionNote permission={steps} /> : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  options: { gap: theme.space.sm },
}));
