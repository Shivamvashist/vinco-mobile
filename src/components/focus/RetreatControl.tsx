import { useEffect, useEffectEvent, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { TRUCES } from '@/features/campaign';
import { FOCUS_RULES, type RetreatPayment, standDownLeftMs } from '@/features/focus';
import type { FocusRetreatResult } from '@/hooks/useFocus';
import { createStyles, useFeedback } from '@/theme';

import { SlideToConfirm } from './SlideToConfirm';

export type RetreatControlProps = {
  /** How a retreat would be paid right now (a Truce, denarii, or the stand-down). */
  payment: RetreatPayment;
  onRetreat: (options: { afterStandDown: boolean }) => FocusRetreatResult;
};

const copy = focusCopy.active;

/**
 * "Slide to retreat". It spends a Truce, else 50 denarii; with neither, the slide starts a
 * 30-second stand-down (a soft tick each second) that the user can cancel, then retreats. Neutral
 * in every tone: it says what it costs and that retreating pays nothing.
 */
export function RetreatControl({ payment, onRetreat }: RetreatControlProps) {
  const styles = useStyles();
  const play = useFeedback();
  const [standDownFrom, setStandDownFrom] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  const finish = (afterStandDown: boolean) => {
    const result = onRetreat({ afterStandDown });
    if (result === 'retreated') {
      play('retreat');
      return;
    }
    if (result === 'standDown') {
      // The purse changed since the screen last read it: stand down first.
      setStandDownFrom(Date.now());
      setNow(Date.now());
      return;
    }
    if (result === 'failed') setError(copy.retreatFailed);
  };

  const handleTick = useEffectEvent(() => {
    if (standDownFrom == null) return;
    const at = Date.now();
    setNow(at);
    if (standDownLeftMs(standDownFrom, at) <= 0) {
      setStandDownFrom(null);
      finish(true);
    } else {
      play('standDown');
    }
  });

  useEffect(() => {
    if (standDownFrom == null) return;
    const timer = setInterval(handleTick, 1000);
    return () => clearInterval(timer);
  }, [standDownFrom]);

  if (standDownFrom != null) {
    const seconds = Math.ceil(standDownLeftMs(standDownFrom, now) / 1000);
    return (
      <View style={styles.standDown} accessibilityLiveRegion="polite">
        <Txt variant="overline">{copy.standDownTitle}</Txt>
        <Txt variant="heading" style={styles.tabular} accessibilityRole="timer">
          {copy.standDownLeft(seconds)}
        </Txt>
        <Button
          label={copy.standDownCancel}
          onPress={() => setStandDownFrom(null)}
          variant="secondary"
          size="compact"
          cue="select"
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <SlideToConfirm
        label={copy.retreat}
        accessibilityHint={copy.retreatHint(payment, TRUCES.priceDenarii, FOCUS_RULES.standDownSeconds)}
        tone="danger"
        icon="close"
        onConfirm={() => {
          setError(null);
          if (payment === 'standDown') {
            play('standDown');
            setStandDownFrom(Date.now());
            setNow(Date.now());
            return;
          }
          finish(false);
        }}
      />
      <Txt
        variant="caption"
        align="center"
        color={error ? 'danger' : 'textMuted'}
        accessibilityLiveRegion="polite"
      >
        {error ?? copy.retreatHint(payment, TRUCES.priceDenarii, FOCUS_RULES.standDownSeconds)}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.sm },
  standDown: { alignItems: 'center', gap: theme.space.sm },
  tabular: { fontVariant: ['tabular-nums'] },
}));
