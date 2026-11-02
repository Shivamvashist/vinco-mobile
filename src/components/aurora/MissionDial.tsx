import { useEffect, useRef } from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { auroraCopy } from '@/copy';
import type { MissionRun } from '@/features/aurora';
import { createStyles, motion, themeSpring, useFeedback, useReduceMotion, useTheme } from '@/theme';

import { Button } from '../Button';
import { PressableScale } from '../PressableScale';
import { ProgressRing } from '../ProgressRing';
import { RollingNumber } from '../RollingNumber';
import { Txt } from '../Txt';

const copy = auroraCopy.ring;
/**
 * The ring takes this share of the window's width, and never more than a share of its height:
 * smaller while the tap button needs the room.
 */
const RING_WIDTH_SHARE = 0.62;
const RING_HEIGHT_SHARE = 0.3;
const RING_HEIGHT_SHARE_TAPS = 0.2;
const PULSE_SCALE = 1.05;

type MissionDialProps = {
  run: MissionRun;
  /** Shown when the chosen mission isn't built yet and the march stands in for it. */
  note?: string;
  /** Called once the count reaches the goal. */
  onDone: () => void;
  /** Called at the first step, swing or tap: the mission is under way. */
  onUnderway?: () => void;
};

/**
 * A ring-time mission: one big count toward the goal inside a ring, one line of instruction, and
 * the tap button when the sensor can't count. Each step or swing gives a short cue; the last one
 * gives the mission's final cue. The march's ring is gold, the sword's is steel (silver).
 */
export function MissionDial({ run, note, onDone, onUnderway }: MissionDialProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const words = copy.missions[run.kind];
  const isTaps = run.mode === 'taps';
  const ringSize = Math.min(
    width * RING_WIDTH_SHARE,
    height * (isTaps ? RING_HEIGHT_SHARE_TAPS : RING_HEIGHT_SHARE),
  );
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));
  const shownCount = useRef(run.count);

  // A cue and a small pulse for each new step or swing; the mission's own cue for the last one.
  const { count, isDone, kind } = run;
  useEffect(() => {
    if (count <= shownCount.current) return;
    if (shownCount.current === 0) onUnderway?.();
    shownCount.current = count;
    if (isDone) {
      play(kind === 'gladius' ? 'sheathe' : 'win');
      onDone();
      return;
    }
    play(kind === 'gladius' ? 'shing' : 'tap');
    if (!reduceMotion) {
      pulse.set(
        withSequence(
          withTiming(PULSE_SCALE, { duration: motion.duration.instant }),
          withSpring(1, themeSpring('pop')),
        ),
      );
    }
  }, [count, isDone, kind, onDone, onUnderway, play, pulse, reduceMotion]);

  const fallbackLine = run.fallback ? words[run.fallback] : null;

  return (
    <View style={styles.root}>
      <Txt variant="eyebrow" color={kind === 'gladius' ? 'currency' : 'accent'} align="center">
        {words.title}
      </Txt>
      {note ? (
        <Txt variant="caption" align="center">
          {note}
        </Txt>
      ) : null}

      {run.mode === 'checking' ? (
        <View style={[styles.checking, { height: ringSize }]} accessibilityLabel={copy.asking}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : (
        <Animated.View style={[styles.ring, pulseStyle]}>
          <ProgressRing
            value={run.count / run.goal}
            size={ringSize}
            strokeWidth={theme.layout.ringStrokeWidth * 2}
            color={kind === 'gladius' ? 'currency' : 'accent'}
            accessibilityLabel={copy.progress(run.count, run.goal, words.unit(run.goal))}
          >
            <RollingNumber value={String(run.count)} variant={isTaps ? 'display' : 'numeral'} />
            <Txt variant="label" color="textMuted">
              {copy.left(run.left, words.unit(run.left))}
            </Txt>
          </ProgressRing>
        </Animated.View>
      )}

      <Txt variant="bodyLarge" align="center" numberOfLines={2}>
        {isTaps ? words.tapInstruction : words.instruction}
      </Txt>
      {isTaps && fallbackLine ? (
        <Txt variant="caption" align="center">
          {fallbackLine}
        </Txt>
      ) : null}

      {isTaps && !run.isDone ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={words.tapButton}
          accessibilityHint={copy.tapHint}
          onPress={run.tap}
          style={styles.tap}
          containerStyle={styles.tapContainer}
        >
          <Txt variant="display" color="onAccent">
            {words.tapButton}
          </Txt>
        </PressableScale>
      ) : null}

      {run.canChooseTaps ? (
        <Button
          label={words.offerTaps}
          variant="ghost"
          size="compact"
          cue="select"
          onPress={run.chooseTaps}
        />
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => {
  const tapSize = theme.space.giant * 2;
  return {
    root: { gap: theme.space.sm, alignItems: 'center' },
    checking: { alignItems: 'center', justifyContent: 'center' },
    ring: { marginVertical: theme.space.sm },
    tapContainer: { alignSelf: 'center', marginTop: theme.space.sm },
    tap: {
      width: tapSize,
      height: tapSize,
      borderRadius: tapSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent,
    },
  };
});
