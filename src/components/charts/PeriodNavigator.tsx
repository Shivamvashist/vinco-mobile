import { View } from 'react-native';

import { createStyles } from '@/theme';

import { IconButton } from '../IconButton';
import { Txt } from '../Txt';

export type PeriodNavigatorProps = {
  /** "27 Oct to 2 Nov", "October 2026", "2026". */
  label: string;
  /** Screen-reader labels for the arrows: "Previous week", "Next week". */
  previousLabel: string;
  nextLabel: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

/**
 * Steps a history chart through time: an arrow either side of the period's name. Forward stops at
 * the current period, back at the first day with history; a stopped arrow dims and says so.
 */
export function PeriodNavigator({
  label,
  previousLabel,
  nextLabel,
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
}: PeriodNavigatorProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <IconButton
        icon="back"
        accessibilityLabel={previousLabel}
        onPress={onPrevious}
        disabled={!canGoBack}
        cue="tap"
      />
      <Txt
        variant="label"
        align="center"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
        style={styles.label}
      >
        {label}
      </Txt>
      <IconButton
        icon="forward"
        accessibilityLabel={nextLabel}
        onPress={onNext}
        disabled={!canGoForward}
        cue="tap"
      />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs },
  label: { flex: 1 },
}));
