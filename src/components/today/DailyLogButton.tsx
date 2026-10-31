import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { createStyles, useFeedback, useTheme } from '@/theme';

import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { ProgressRing } from '../ProgressRing';

export type DailyLogButtonProps = {
  /** Logs done today (selfie, weight, calories). */
  done: number;
  total: number;
  onPress: () => void;
};

const copy = todayCopy.quickLogs;

/**
 * The daily log's one entry point on Today: a round button floating at the bottom right, its ring
 * filling as the selfie, weight and calories are logged. Quiet once all are in (a check).
 * Opens the daily log sheet. The parent places it (absolute, over the scroll).
 */
export function DailyLogButton({ done, total, onPress }: DailyLogButtonProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const isComplete = total > 0 && done >= total;
  const size = theme.layout.buttonHeight;

  return (
    <PressableScale
      scaleTo="button"
      accessibilityRole="button"
      accessibilityLabel={copy.openLabel(done, total)}
      accessibilityHint={copy.openHint}
      onPress={() => {
        play('tap');
        onPress();
      }}
      style={styles.button}
    >
      <View style={styles.ring} importantForAccessibility="no-hide-descendants">
        <ProgressRing
          value={total > 0 ? done / total : 0}
          size={size}
          strokeWidth={theme.layout.hairline * 3}
          accessibilityLabel={copy.openLabel(done, total)}
        />
      </View>
      <Icon name={isComplete ? 'check' : 'plus'} color={isComplete ? 'textMuted' : 'accent'} />
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  button: {
    width: theme.layout.buttonHeight,
    height: theme.layout.buttonHeight,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
    backgroundColor: theme.colors.surfaceRaised,
    boxShadow: theme.effects.cardShadow,
  },
  ring: { position: 'absolute', top: 0, left: 0 },
}));
