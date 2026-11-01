import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { focusCopy } from '@/copy';
import type { FocusSessionRow } from '@/db';
import { canRetreat, type FocusComes, isFocusGuard } from '@/features/focus';
import type { FocusRetreatResult } from '@/hooks/useFocus';
import { useRainSound } from '@/hooks/useRainSound';
import { useScreensaver } from '@/hooks/useScreensaver';
import { formatClockTime } from '@/lib/dates';
import { useFocusUiStore } from '@/stores';
import { createStyles, themeTiming, useFeedback, useReduceMotion, useTheme } from '@/theme';

import { DriftingClock } from './DriftingClock';
import { FocusDock } from './FocusDock';
import { FocusHero } from './FocusHero';
import { RainTile } from './RainTile';
import { RetreatControl } from './RetreatControl';
import { TruceSheet } from './TruceSheet';
import { TruceTile } from './TruceTile';

export type FocusActiveProps = {
  session: FocusSessionRow;
  remainingMs: number;
  truceReserve: number;
  onRetreat: () => FocusRetreatResult;
  comites: readonly FocusComes[];
  dialerPackage: string | null;
  /** Silentium: the screen can't be left, so there is no minimise button. */
  isLocked: boolean;
  onMinimise: () => void;
};

/** The screensaver clock's size: a share of the window width, never taller than a share of its height. */
const CLOCK_WIDTH_SHARE = 0.26;
const CLOCK_HEIGHT_SHARE = 0.13;

/**
 * The running focus, one composed screen: the time left in a draining ring (the hero, taking the
 * height there is), one small line under it (when it ends, the guard), then a row of tiles (the
 * Truces, the rain with its sound), the companions' dock and "Slide to retreat". Ending early
 * spends a Truce; with none, the slide snaps back and the Truce tile shakes and offers one.
 * Kept awake; after 10 seconds without a touch the controls fade, the clock drifts and the screen
 * dims (useScreensaver). Any touch wakes it.
 */
export function FocusActive({
  session,
  remainingMs,
  truceReserve,
  onRetreat,
  comites,
  dialerPackage,
  isLocked,
  onMinimise,
}: FocusActiveProps) {
  useKeepAwake();
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const screensaver = useScreensaver(true);
  const isRainSoundOn = useFocusUiStore((state) => state.isRainSoundOn);
  const setRainSound = useFocusUiStore((state) => state.setRainSound);
  const [alertKey, setAlertKey] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const awake = useSharedValue(1);
  useRainSound(isRainSoundOn, true);

  const driftSize = Math.round(
    Math.min(window.width * CLOCK_WIDTH_SHARE, window.height * CLOCK_HEIGHT_SHARE),
  );
  const guard = isFocusGuard(session.guard) ? focusCopy.setup.guards[session.guard].plain : '';
  const endsAt = new Date(session.endsAt);
  const endsAtLabel = Number.isFinite(endsAt.getTime()) ? formatClockTime(endsAt) : '';
  const totalMs = Date.parse(session.endsAt) - Date.parse(session.startedAt);
  const share = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0;
  const hasTruce = canRetreat(truceReserve);

  useEffect(() => {
    const target = screensaver.isAsleep ? 0 : 1;
    awake.set(reduceMotion ? target : withTiming(target, themeTiming('slower')));
  }, [screensaver.isAsleep, reduceMotion, awake]);

  const controlsStyle = useAnimatedStyle(() => ({ opacity: awake.get() }));

  const handleRefused = () => {
    play('denied');
    setAlertKey((key) => key + 1);
    AccessibilityInfo.announceForAccessibility(focusCopy.active.noTruceAlert);
  };

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
            <View style={styles.lock} accessible accessibilityLabel={focusCopy.active.locked}>
              <Icon name="lock" color="textMuted" size={theme.layout.iconSizeSmall} />
            </View>
          ) : (
            <IconButton
              icon="back"
              accessibilityLabel={focusCopy.active.minimise}
              onPress={onMinimise}
              color="textMuted"
            />
          )}
        </View>

        <View style={styles.hero}>
          <FocusHero
            remainingMs={remainingMs}
            remainingShare={share}
            meta={focusCopy.active.meta(endsAtLabel, guard)}
          />
        </View>

        <View style={styles.controls}>
          <View style={styles.tiles}>
            <TruceTile count={truceReserve} alertKey={alertKey} onBuy={() => setIsSheetOpen(true)} />
            <RainTile
              isSoundOn={isRainSoundOn}
              onToggleSound={() => setRainSound(!isRainSoundOn)}
              isPaused={screensaver.isAsleep}
            />
          </View>
          <FocusDock comites={comites} dialerPackage={dialerPackage} />
          <RetreatControl canRetreat={hasTruce} onRetreat={onRetreat} onRefused={handleRefused} />
        </View>
      </Animated.View>

      {screensaver.isAsleep ? <DriftingClock remainingMs={remainingMs} fontSize={driftSize} /> : null}

      <TruceSheet
        // A Truce bought elsewhere meanwhile (the Forum) closes it: nothing left to buy for.
        visible={isSheetOpen && !hasTruce}
        mode="retreat"
        onClose={() => setIsSheetOpen(false)}
        onBought={() => setIsSheetOpen(false)}
      />
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
  lock: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The free height is shared four to one: the hero's ring grows first, then the tiles (the rain
  // gets taller on tall phones, up to a cap). The controls never shrink below their content, so
  // every control stays in view on a small phone; the ring gives way instead.
  hero: {
    flexGrow: 4,
    flexShrink: 1,
    flexBasis: 0,
    paddingHorizontal: theme.layout.flowGutter,
    paddingBottom: theme.space.md,
  },
  controls: {
    flexGrow: 1,
    flexShrink: 0,
    justifyContent: 'flex-end',
    gap: theme.space.md,
    paddingHorizontal: theme.layout.flowGutter,
  },
  tiles: {
    flexGrow: 1,
    flexDirection: 'row',
    gap: theme.space.sm,
    minHeight: theme.layout.minTouchTarget * 2,
    maxHeight: theme.layout.tileHeight + theme.space.huge,
  },
}));
