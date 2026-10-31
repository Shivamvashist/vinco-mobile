import { useIsFocused } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { expectedFocusReward, formatFocusClock } from '@/features/focus';
import { useFocus } from '@/hooks/useFocus';
import { usePreferencesStore } from '@/stores';
import { createStyles, themeSpring, themeTiming, useFeedback, useReduceMotion, useTheme } from '@/theme';

import { FocusComplete } from './FocusComplete';
import { FocusMorph } from './FocusMorph';
import { FocusRunning } from './FocusRunning';
import { FocusSetup } from './FocusSetup';

export type FocusLauncherProps = {
  /** Before onboarding: shown, but it can't be opened. */
  isDisabled?: boolean;
};

/** How far a new stage (setup, running, complete) rises as it fades in. */
const STAGE_RISE = 16;

/**
 * The Focus CTA on Today, and the focus view it springs open into ("Acies", docs/TODAY-AND-FOCUS.md
 * section 4). It shows "Ready" or the time left; tapping it grows the row into the full-screen view
 * (setup, running or complete). A focus that finished while the app was closed opens on its
 * completion the next time Today shows.
 */
export function FocusLauncher({ isDisabled = false }: FocusLauncherProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const tone = usePreferencesStore((state) => state.tone);
  const focus = useFocus();
  const isScreenFocused = useIsFocused();
  const anchorRef = useAnimatedRef<View>();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // A focus just finished (here or while the app was closed): open on its completion.
  if (focus.settled && !isMounted && isScreenFocused) {
    setIsMounted(true);
    setIsOpen(true);
  }

  const clock = formatFocusClock(focus.remainingMs);
  const stage = focus.settled ? 'complete' : focus.running ? 'running' : 'setup';

  const handleOpen = () => {
    if (isDisabled) return;
    play('tap');
    setIsMounted(true);
    setIsOpen(true);
  };
  const handleClose = () => setIsOpen(false);
  const handleClosed = () => {
    setIsMounted(false);
    focus.dismissSettled();
  };

  return (
    <>
      <PressableScale
        scaleTo="card"
        disabled={isDisabled}
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={focus.running ? focusCopy.cta.runningLabel(clock) : focusCopy.cta.label}
        accessibilityHint={focusCopy.cta.hint}
        accessibilityState={{ disabled: isDisabled }}
        style={isDisabled ? styles.disabled : undefined}
      >
        <Animated.View ref={anchorRef} collapsable={false} style={[styles.row, isMounted && styles.hidden]}>
          <View style={styles.playButton}>
            <Icon name="play" color="onAccent" size={theme.layout.iconSize} strokeWidth={2.2} />
          </View>
          <View style={styles.labels}>
            <Txt variant="label" numberOfLines={1}>
              {focusCopy.cta.title}
            </Txt>
            <Txt variant="caption" numberOfLines={1}>
              {focusCopy.cta.subtitle}
            </Txt>
          </View>
          <StatusDot
            isRunning={focus.running != null}
            label={focus.running ? focusCopy.cta.left(clock) : focusCopy.cta.ready}
          />
        </Animated.View>
      </PressableScale>

      {isMounted ? (
        <FocusMorph
          anchorRef={anchorRef}
          anchorRadius={theme.radius.lg}
          isOpen={isOpen}
          onClosed={handleClosed}
          onRequestClose={handleClose}
        >
          <Stage key={stage}>
            {stage === 'complete' && focus.settled ? (
              <FocusComplete session={focus.settled} tone={tone} onDone={handleClose} />
            ) : stage === 'running' && focus.running ? (
              <FocusRunning
                session={focus.running}
                remainingMs={focus.remainingMs}
                expectedReward={expectedFocusReward(
                  focus.running.minutes,
                  focus.running.guard,
                  focus.rewardedToday,
                )}
                onMinimise={handleClose}
                onRetreat={focus.retreat}
              />
            ) : (
              <FocusSetup
                tone={tone}
                rewardedToday={focus.rewardedToday}
                onBegin={focus.start}
                onClose={handleClose}
              />
            )}
          </Stage>
        </FocusMorph>
      ) : null}
    </>
  );
}

/** "Ready" with a still dot, or the time left with a slow pulse. */
function StatusDot({ isRunning, label }: { isRunning: boolean; label: string }) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!isRunning || reduceMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(withTiming(0.3, themeTiming('slower')), withTiming(1, themeTiming('slower'))),
      -1,
    );
  }, [isRunning, reduceMotion, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.status}>
      <Animated.View style={[styles.dot, isRunning ? styles.dotRunning : styles.dotReady, dotStyle]} />
      <Txt
        variant="labelSmall"
        color={isRunning ? 'text' : 'textMuted'}
        numberOfLines={1}
        style={styles.tabular}
      >
        {label}
      </Txt>
    </View>
  );
}

/** Each stage fades and rises in when it takes over the view. */
function Stage({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const enter = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!reduceMotion) enter.value = withSpring(1, themeSpring('settle'));
  }, [enter, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * STAGE_RISE }],
  }));

  return <Animated.View style={[styles.stage, style]}>{children}</Animated.View>;
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    padding: theme.space.md,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  hidden: { opacity: 0 },
  disabled: { opacity: 0.5 },
  playButton: {
    width: theme.layout.buttonHeight,
    height: theme.layout.buttonHeight,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  labels: { flex: 1, gap: theme.space.xxs },
  status: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs, flexShrink: 0 },
  dot: { width: theme.space.sm, height: theme.space.sm, borderRadius: theme.radius.pill },
  dotReady: { backgroundColor: theme.colors.success },
  dotRunning: { backgroundColor: theme.colors.accent },
  tabular: { fontVariant: ['tabular-nums'] },
  stage: { flex: 1 },
}));
