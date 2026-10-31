import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { splitFocusClock } from '@/features/focus';
import { createStyles } from '@/theme';

import { RollingClock } from './RollingClock';

export type FocusClockProps = {
  remainingMs: number;
  /** The h:mm digits' size; the seconds sit beside them at a third of it. */
  fontSize: number;
};

/** The time left: a large h:mm in the display face, the seconds small beside it. One "timer" for screen readers. */
export function FocusClock({ remainingMs, fontSize }: FocusClockProps) {
  const styles = useStyles();
  const { hoursMinutes, seconds } = splitFocusClock(remainingMs);
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={focusCopy.active.timeLeftLabel(`${hoursMinutes}:${seconds}`)}
    >
      <RollingClock text={hoursMinutes} fontSize={fontSize} />
      <Txt
        variant="headingSmall"
        color="textMuted"
        style={[
          styles.seconds,
          { fontSize: fontSize * SECONDS_SHARE, lineHeight: fontSize * SECONDS_SHARE * 1.2 },
        ]}
        importantForAccessibility="no"
      >
        {seconds}
      </Txt>
    </View>
  );
}

const SECONDS_SHARE = 0.32;

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: theme.space.sm },
  seconds: { fontVariant: ['tabular-nums'], marginBottom: theme.space.md },
}));
