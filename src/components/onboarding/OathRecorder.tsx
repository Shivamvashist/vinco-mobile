import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { onboardingCopy } from '@/copy';
import { deleteMediaFile, saveOath } from '@/media';
import { createStyles, restoreUiAudioMode, themeEasing, useFeedback, useReduceMotion } from '@/theme';

import { Button } from '../Button';
import { Icon } from '../Icon';
import { Txt } from '../Txt';

const copy = onboardingCopy.oath;
const LIMIT_SECONDS = 20;
/** A tap shorter than this is a mistake, not an oath. */
const MIN_RECORDING_MS = 1000;
const BAR_COUNT = 24;

// One-off sizes from the prototype's oath screen.
const RECORD_BUTTON_SIZE = 96;
const RECORD_ICON_SIZE = 34;
const STOP_SQUARE_SIZE = 28;
const WAVEFORM_HEIGHT = 64;
const SEAL_SIZE = 120;
const HINT_MAX_WIDTH = 300;
const RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

type Phase = 'idle' | 'recording' | 'saving' | 'sealed' | 'denied' | 'failed';

export type OathRecorderProps = {
  /** An oath saved earlier (resumed onboarding), shown as sealed. */
  savedPath: string | null;
  onSaved: (path: string) => void;
  onCleared: () => void;
};

/**
 * Records the oath: up to 20 seconds, kept on the phone. Asks for the microphone only when
 * the user taps record, and offers Settings if it was refused.
 */
export function OathRecorder({ savedPath, onSaved, onCleared }: OathRecorderProps) {
  const styles = useStyles();
  const play = useFeedback();
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 100);
  const [phase, setPhase] = useState<Phase>(savedPath ? 'sealed' : 'idle');
  const [recordedSeconds, setRecordedSeconds] = useState<number | null>(null);

  const elapsedSeconds = Math.min(LIMIT_SECONDS, Math.floor(recorderState.durationMillis / 1000));

  const start = async () => {
    try {
      const current = await getRecordingPermissionsAsync();
      const permission = current.granted ? current : await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setPhase('denied');
        return;
      }
      // The start beep plays before the microphone opens, so it isn't in the recording.
      play('recordStart');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
    } catch (error) {
      if (__DEV__) console.warn('[oath] Could not start recording.', error);
      setPhase('failed');
      void restoreUiAudioMode();
    }
  };

  const stop = async () => {
    const durationMs = recorderState.durationMillis;
    setPhase('saving');
    try {
      await recorder.stop();
      await restoreUiAudioMode();
      const uri = recorder.uri;
      if (!uri || durationMs < MIN_RECORDING_MS) {
        deleteMediaFile(uri);
        setPhase('idle');
        return;
      }
      const path = await saveOath(uri);
      setRecordedSeconds(Math.max(1, Math.round(durationMs / 1000)));
      onSaved(path);
      play('recordStop');
      setPhase('sealed');
    } catch (error) {
      if (__DEV__) console.warn('[oath] Could not save recording.', error);
      setPhase('failed');
    }
  };

  // The latest stop(), for the time-limit effect below.
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  });

  // Stop on its own at the time limit.
  const hasReachedLimit = phase === 'recording' && recorderState.durationMillis >= LIMIT_SECONDS * 1000;
  useEffect(() => {
    if (hasReachedLimit) void stopRef.current();
  }, [hasReachedLimit]);

  const recordAgain = () => {
    deleteMediaFile(savedPath);
    onCleared();
    setRecordedSeconds(null);
    setPhase('idle');
  };

  if (phase === 'sealed') {
    return (
      <View style={styles.centre}>
        <WaxSeal />
        <Txt variant="heading" align="center" style={styles.sealedTitle}>
          {copy.sealedTitle}
        </Txt>
        <Txt variant="caption" align="center">
          {recordedSeconds != null ? copy.sealedDetail(recordedSeconds) : copy.sealedResumed}
        </Txt>
        <View style={styles.again}>
          <Button
            label={copy.recordAgain}
            variant="secondary"
            size="compact"
            cue={null}
            onPress={recordAgain}
          />
        </View>
      </View>
    );
  }

  const isRecording = phase === 'recording';
  const level = isRecording ? meteringToLevel(recorderState.metering) : 0;

  return (
    <View style={styles.centre}>
      <Waveform level={level} timeMs={recorderState.durationMillis} isActive={isRecording} />
      <Txt variant="title" color={isRecording ? 'text' : 'textMuted'} style={styles.timer}>
        {copy.timer(isRecording ? elapsedSeconds : 0, LIMIT_SECONDS)}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRecording ? copy.stopRecording : copy.startRecording}
        accessibilityState={{ busy: phase === 'saving' }}
        disabled={phase === 'saving'}
        onPress={() => void (isRecording ? stop() : start())}
        style={({ pressed }) => [
          styles.record,
          isRecording && styles.recordActive,
          pressed && styles.pressed,
        ]}
      >
        {isRecording ? (
          <View style={styles.stopSquare} />
        ) : (
          <Icon name="mic" size={RECORD_ICON_SIZE} color="onAccent" strokeWidth={2} />
        )}
      </Pressable>
      <Txt variant="caption" align="center" style={styles.hint}>
        {phase === 'denied'
          ? copy.permissionDenied
          : phase === 'failed'
            ? copy.failed
            : isRecording
              ? copy.recordingHint
              : copy.idleHint(LIMIT_SECONDS)}
      </Txt>
      {phase === 'denied' ? (
        <Button
          label={copy.openSettings}
          variant="secondary"
          size="compact"
          cue={null}
          onPress={() => void Linking.openSettings()}
        />
      ) : null}
    </View>
  );
}

/** Microphone level in decibels (about -60 quiet to 0 loud) to 0 to 1. */
function meteringToLevel(decibels: number | undefined): number {
  if (decibels == null || !Number.isFinite(decibels)) return 0.3;
  return Math.min(1, Math.max(0, (decibels + 60) / 60));
}

type WaveformProps = { level: number; timeMs: number; isActive: boolean };

/** Bars that move with the voice while recording, flat otherwise. Decorative. */
function Waveform({ level, timeMs, isActive }: WaveformProps) {
  const styles = useStyles();
  return (
    <View style={styles.waveform} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {Array.from({ length: BAR_COUNT }, (_, index) => {
        const ripple = 0.5 + 0.5 * Math.abs(Math.sin(timeMs * 0.007 + index * 0.9));
        const height = isActive ? 8 + level * 48 * ripple : 6;
        return <View key={index} style={[styles.bar, isActive && styles.barActive, { height }]} />;
      })}
    </View>
  );
}

/** The wax seal pressed onto a sealed oath. */
function WaxSeal() {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const press = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!reduceMotion) press.value = withTiming(1, { duration: 600, easing: themeEasing() });
  }, [press, reduceMotion]);

  const pressStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, press.value * 1.6),
    transform: [{ scale: 1.8 - 0.8 * press.value }, { rotate: `${-30 * (1 - press.value)}deg` }],
  }));

  return (
    <Animated.View style={[styles.seal, pressStyle]} importantForAccessibility="no-hide-descendants">
      <Txt variant="display" color="onSeal">
        V
      </Txt>
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  centre: { alignItems: 'center', gap: theme.space.lg, paddingVertical: theme.space.xxl },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs, height: WAVEFORM_HEIGHT },
  bar: { width: theme.space.xs, borderRadius: theme.radius.xs, backgroundColor: theme.colors.border },
  barActive: { backgroundColor: theme.colors.danger },
  timer: { fontVariant: ['tabular-nums'] },
  record: {
    width: RECORD_BUTTON_SIZE,
    height: RECORD_BUTTON_SIZE,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  recordActive: { backgroundColor: theme.colors.danger },
  pressed: { opacity: 0.85 },
  stopSquare: {
    width: STOP_SQUARE_SIZE,
    height: STOP_SQUARE_SIZE,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.text,
  },
  hint: { maxWidth: HINT_MAX_WIDTH },
  seal: {
    width: SEAL_SIZE,
    height: SEAL_SIZE,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.seal,
  },
  sealedTitle: { marginTop: theme.space.sm },
  again: { marginTop: theme.space.sm },
}));
