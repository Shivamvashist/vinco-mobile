import { useKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import { RollingNumber } from '@/components/RollingNumber';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import type { FocusSessionRow } from '@/db';
import type { FocusComes, RetreatPayment } from '@/features/focus';
import type { FocusRetreatResult } from '@/hooks/useFocus';
import { useScreensaver } from '@/hooks/useScreensaver';
import { formatClockTime } from '@/lib/dates';
import { createStyles, themeTiming, useReduceMotion, useTheme } from '@/theme';

import { DriftingClock } from './DriftingClock';
import { FocusClock } from './FocusClock';
import { FocusDock } from './FocusDock';
import { RainField } from './RainField';
import { RetreatControl } from './RetreatControl';

export type FocusActiveProps = {
  session: FocusSessionRow;
  remainingMs: number;
  truceReserve: number;
  retreatPayment: RetreatPayment;
  onRetreat: (options: { afterStandDown: boolean }) => FocusRetreatResult;
  comites: readonly FocusComes[];
  dialerPackage: string | null;
  /** Silentium: the screen can't be left, so there is no minimise button. */
  isLocked: boolean;
  onMinimise: () => void;
};

/** The digits' size: a share of the window width, never taller than a share of its height. */
const CLOCK_WIDTH_SHARE = 0.26;
const CLOCK_HEIGHT_SHARE = 0.13;

/**
 * The running focus: the time left, when it ends, the Truces held, a small rain field, "Slide to
 * retreat" and the dock. Kept awake; after 10 seconds without a touch the controls fade, the clock
 * drifts and the screen dims (useScreensaver). Any touch wakes it.
 */
export function FocusActive({
  session,
  remainingMs,
  truceReserve,
  retreatPayment,
  onRetreat,
  comites,
  dialerPackage,
  isLocked,
  onMinimise,
}: FocusActiveProps) {
  useKeepAwake();
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const screensaver = useScreensaver(true);
  const awake = useSharedValue(1);
  const fontSize = Math.round(Math.min(window.width * CLOCK_WIDTH_SHARE, window.height * CLOCK_HEIGHT_SHARE));
  const guardText = focusCopy.setup.guards[session.guard];
  const endsAt = new Date(session.endsAt);
  const endsAtLabel = Number.isFinite(endsAt.getTime()) ? formatClockTime(endsAt) : '';

  useEffect(() => {
    const target = screensaver.isAsleep ? 0 : 1;
    awake.set(reduceMotion ? target : withTiming(target, themeTiming('slower')));
  }, [screensaver.isAsleep, reduceMotion, awake]);

  const controlsStyle = useAnimatedStyle(() => ({ opacity: awake.get() }));

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + theme.space.lg }]}
      onTouchStart={screensaver.wake}
      accessibilityHint={screensaver.isAsleep ? focusCopy.active.wake : undefined}
    >
      <Animated.View
        style={[styles.fill, controlsStyle]}
        pointerEvents={screensaver.isAsleep ? 'none' : 'auto'}
        importantForAccessibility={screensaver.isAsleep ? 'no-hide-descendants' : 'auto'}
      >
        <View style={styles.header}>
          {isLocked ? (
            <View style={styles.headerSpacer} />
          ) : (
            <IconButton
              icon="back"
              accessibilityLabel={focusCopy.active.minimise}
              onPress={onMinimise}
              color="textMuted"
            />
          )}
          <Txt variant="eyebrow" numberOfLines={1} style={styles.eyebrow}>
            {focusCopy.active.eyebrow(`${guardText.name} · ${guardText.plain}`)}
          </Txt>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.body}>
          <FocusClock remainingMs={remainingMs} fontSize={fontSize} />
          {isLocked ? (
            <Txt variant="caption" align="center">
              {focusCopy.active.locked}
            </Txt>
          ) : null}

          <View style={styles.tiles}>
            <View style={styles.tile} accessible accessibilityLabel={focusCopy.active.endsAt(endsAtLabel)}>
              <Txt variant="overline">{focusCopy.active.ends}</Txt>
              <Txt variant="heading" numberOfLines={1}>
                {endsAtLabel}
              </Txt>
            </View>
            <View style={styles.tileRow}>
              <View
                style={[styles.tile, styles.half]}
                accessible
                accessibilityLabel={`${focusCopy.active.truces}, ${truceReserve}`}
              >
                <Txt variant="overline" numberOfLines={1}>
                  {focusCopy.active.truces}
                </Txt>
                <RollingNumber value={String(truceReserve)} variant="heading" />
              </View>
              <View style={[styles.tile, styles.half, styles.rainTile]}>
                <RainField isPaused={screensaver.isAsleep} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <RetreatControl payment={retreatPayment} onRetreat={onRetreat} />
          <FocusDock comites={comites} dialerPackage={dialerPackage} />
        </View>
      </Animated.View>

      {screensaver.isAsleep ? <DriftingClock remainingMs={remainingMs} fontSize={fontSize} /> : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.sm,
    minHeight: theme.layout.minTouchTarget,
  },
  eyebrow: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: theme.layout.minTouchTarget },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.space.xl,
    paddingHorizontal: theme.layout.flowGutter,
  },
  tiles: { gap: theme.space.sm },
  tileRow: { flexDirection: 'row', gap: theme.space.sm },
  tile: {
    gap: theme.space.xxs,
    minHeight: theme.layout.minTouchTarget + theme.space.xl,
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
    backgroundColor: theme.colors.surface,
    boxShadow: theme.effects.cardShadow,
  },
  half: { flex: 1 },
  rainTile: { padding: 0, overflow: 'hidden' },
  footer: { gap: theme.space.md, paddingHorizontal: theme.layout.flowGutter },
}));
