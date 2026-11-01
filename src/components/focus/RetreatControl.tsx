import { useState } from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import type { FocusRetreatResult } from '@/hooks/useFocus';
import { createStyles, useFeedback } from '@/theme';

import { SlideToConfirm } from './SlideToConfirm';

export type RetreatControlProps = {
  /** A Truce is held, so the focus can end early. */
  canRetreat: boolean;
  /** Spends a Truce and ends the focus (checked again with fresh values). */
  onRetreat: () => FocusRetreatResult;
  /** No Truce: the slide snaps back and the caller points at the Truce tile. */
  onRefused: () => void;
};

const copy = focusCopy.active;

/**
 * "Slide to retreat": ends the focus early for one Truce; it pays nothing. With no Truce held the
 * knob snaps back and nothing ends. Neutral in every tone; the cost is in the hint for screen
 * readers, and the Truce tile beside it shows the count.
 */
export function RetreatControl({ canRetreat, onRetreat, onRefused }: RetreatControlProps) {
  const styles = useStyles();
  const play = useFeedback();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setError(null);
    if (!canRetreat) {
      onRefused();
      return;
    }
    const result = onRetreat();
    if (result === 'retreated') play('retreat');
    // The purse changed since the screen last read it.
    else if (result === 'noTruce') onRefused();
    else if (result === 'failed') setError(copy.retreatFailed);
  };

  return (
    <View style={styles.wrap}>
      <SlideToConfirm
        label={copy.retreat}
        accessibilityHint={canRetreat ? copy.retreatHint : copy.retreatHintNoTruce}
        tone="danger"
        icon="close"
        onConfirm={handleConfirm}
      />
      {error ? (
        <Txt variant="caption" align="center" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.sm },
}));
