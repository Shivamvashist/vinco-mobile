import { ActivityIndicator, Pressable, View } from 'react-native';

import { auroraCopy } from '@/copy';
import { AURORA_RULES } from '@/features/aurora';
import type { March } from '@/hooks/useMarch';
import { createStyles, useFeedback, useTheme } from '@/theme';

import { Card } from '../Card';
import { ProgressBar } from '../ProgressBar';
import { Txt } from '../Txt';

const copy = auroraCopy.ring;

type MarchPanelProps = {
  march: March;
  /** Shown when the chosen mission isn't built yet and the march stands in for it. */
  note?: string;
};

/** The march mission: steps (or taps) to go, a bar, and the tap button when there is no step counter. */
export function MarchPanel({ march, note }: MarchPanelProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const isTaps = march.mode === 'taps';

  return (
    <Card style={styles.card}>
      <Txt variant="eyebrow" color="accent">
        {copy.marchTitle}
      </Txt>
      {note ? <Txt variant="caption">{note}</Txt> : null}
      {march.mode === 'checking' ? (
        <View style={styles.checking} accessibilityLabel={copy.asking}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : (
        <>
          <Txt variant="numeral" align="center" accessibilityLiveRegion="polite">
            {march.left}
          </Txt>
          <Txt variant="label" align="center">
            {isTaps ? copy.tapsLeft(march.left) : copy.stepsLeft(march.left)}
          </Txt>
          <ProgressBar
            size="thick"
            value={march.count / AURORA_RULES.marchSteps}
            accessibilityLabel={copy.stepsLeft(march.left)}
          />
          <Txt variant="caption" align="center">
            {isTaps ? copy.marchTaps : copy.marchSteps}
          </Txt>
        </>
      )}
      {isTaps && !march.isDone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.tapButton}
          accessibilityHint={copy.tapHint}
          onPress={() => {
            play('stepUp');
            march.tap();
          }}
          style={({ pressed }) => [styles.tap, pressed && styles.tapPressed]}
        >
          <Txt variant="display" color="onAccent">
            {copy.tapButton}
          </Txt>
        </Pressable>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((theme) => {
  const tapSize = theme.space.giant * 2.5;
  return {
    card: { gap: theme.space.sm, alignItems: 'stretch' },
    checking: { paddingVertical: theme.space.xxl, alignItems: 'center' },
    tap: {
      alignSelf: 'center',
      width: tapSize,
      height: tapSize,
      borderRadius: tapSize / 2,
      marginTop: theme.space.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent,
    },
    tapPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  };
});
