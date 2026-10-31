import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import type { FocusSessionRow } from '@/db';
import { FOCUS_RULES, formatFocusClock } from '@/features/focus';
import { formatClockTime } from '@/lib/dates';
import { createStyles, useTheme } from '@/theme';

import { CountdownRing } from './CountdownRing';
import { HoldToConfirm } from './HoldToConfirm';
import { RollingClock } from './RollingClock';

export type FocusRunningProps = {
  session: FocusSessionRow;
  remainingMs: number;
  /** What holding to the end will pay (0 when it pays nothing). */
  expectedReward: number;
  /** Closes the view; the focus keeps running and the CTA shows the time left. */
  onMinimise: () => void;
  /** Gives up (after the hold). */
  onRetreat: () => void;
};

/** The ring's share of the window: the smaller of the width and a share of the height. */
const RING_WIDTH_SHARE = 0.78;
const RING_HEIGHT_SHARE = 0.42;
/** The digits' size as a share of the ring. */
const DIGITS_SHARE = 0.2;

/** A running focus: the ring and clock, the guard, when it ends, and "Retreat" behind a hold. */
export function FocusRunning({
  session,
  remainingMs,
  expectedReward,
  onMinimise,
  onRetreat,
}: FocusRunningProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const ringSize = Math.round(Math.min(window.width * RING_WIDTH_SHARE, window.height * RING_HEIGHT_SHARE));
  const clock = formatFocusClock(remainingMs);
  const guardText = focusCopy.setup.guards[session.guard];
  const endsAt = new Date(session.endsAt);
  const endsAtLabel = Number.isFinite(endsAt.getTime())
    ? focusCopy.running.endsAt(formatClockTime(endsAt))
    : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + theme.space.xl }]}>
      <View style={styles.header}>
        <View style={styles.chevronDown}>
          <IconButton
            icon="back"
            accessibilityLabel={focusCopy.running.minimise}
            onPress={onMinimise}
            color="textMuted"
          />
        </View>
        <Txt variant="eyebrow" numberOfLines={1} style={styles.eyebrow}>
          {focusCopy.running.eyebrow(guardText.name)}
        </Txt>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <View
          accessible
          accessibilityRole="timer"
          accessibilityLabel={focusCopy.running.timeLeftLabel(clock)}
        >
          <CountdownRing
            startedAt={session.startedAt}
            endsAt={session.endsAt}
            remainingMs={remainingMs}
            size={ringSize}
            strokeWidth={theme.layout.ringStrokeWidth + 1}
          >
            <RollingClock text={clock} fontSize={Math.round(ringSize * DIGITS_SHARE)} />
            <Txt variant="overline">{focusCopy.running.left}</Txt>
          </CountdownRing>
        </View>

        <View style={styles.details}>
          <View style={styles.guardRow}>
            <Txt variant="heading">{guardText.name}</Txt>
            <Txt variant="caption">{guardText.plain}</Txt>
          </View>
          {endsAtLabel ? (
            <Txt variant="body" color="textMuted">
              {endsAtLabel}
            </Txt>
          ) : null}
          {expectedReward > 0 ? (
            <View style={styles.rewardRow}>
              <Icon name="coin" color="currency" size={theme.layout.iconSizeSmall} />
              <Txt variant="labelSmall" color="currency">
                {focusCopy.setup.reward(expectedReward)}
              </Txt>
            </View>
          ) : null}
        </View>
      </View>

      <HoldToConfirm
        label={focusCopy.running.retreat}
        accessibilityHint={focusCopy.running.retreatHint}
        holdMs={FOCUS_RULES.giveUpHoldMs}
        onConfirm={onRetreat}
      />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.sm,
    minHeight: theme.layout.minTouchTarget,
  },
  chevronDown: { transform: [{ rotate: '-90deg' }] },
  eyebrow: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: theme.layout.minTouchTarget },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.xxl,
    paddingHorizontal: theme.layout.flowGutter,
  },
  details: { alignItems: 'center', gap: theme.space.sm },
  guardRow: { flexDirection: 'row', alignItems: 'baseline', gap: theme.space.sm },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs },
}));
