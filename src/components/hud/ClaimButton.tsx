import { useRef } from 'react';
import { View } from 'react-native';

import type { ClaimPay } from '@/features/labours';
import type { ClaimOutcome } from '@/hooks/useLabours';
import { createStyles, useFeedback } from '@/theme';

import { PressableScale } from '../PressableScale';
import { Txt } from '../Txt';

import { launchRewardFlight, measureCentre } from './rewardFlight';

export type ClaimButtonProps = {
  label: string;
  accessibilityLabel: string;
  /** Writes the claim (synchronously) and says what it paid or why not. */
  onClaim: () => ClaimOutcome;
  /** Called when the claim was refused or failed. */
  onProblem?: (problem: Exclude<ClaimOutcome, { pay: ClaimPay }>['problem']) => void;
};

/**
 * The gold "Claim" pill. The claim is written first; then the rewards fly from this button to
 * their counters (or, with reduce motion, the counters just change).
 */
export function ClaimButton({ label, accessibilityLabel, onClaim, onProblem }: ClaimButtonProps) {
  const styles = useStyles();
  const play = useFeedback();
  const viewRef = useRef<View>(null);

  const handlePress = () => {
    const outcome = onClaim();
    if ('problem' in outcome) {
      play('denied');
      onProblem?.(outcome.problem);
      return;
    }
    play('confirm');
    const { denarii, gloria, truces } = outcome.pay;
    measureCentre(viewRef.current, (from) => {
      if (from) launchRewardFlight({ from, rewards: { denarii, gloria, truces } });
    });
  };

  return (
    <View ref={viewRef} collapsable={false}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={handlePress}
        style={styles.button}
        pressedStyle={styles.pressed}
      >
        <Txt variant="labelSmall" color="onAccent">
          {label}
        </Txt>
      </PressableScale>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  button: {
    minHeight: theme.layout.minTouchTarget,
    minWidth: theme.layout.minTouchTarget * 1.6,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  pressed: { backgroundColor: theme.colors.accentPressed },
}));
