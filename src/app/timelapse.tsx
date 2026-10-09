import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { commonCopy, proofCopy } from '@/copy';
import { useActiveArc } from '@/hooks/useActiveArc';
import { type ReelScope, useSelfieReel } from '@/hooks/useSelfieReel';
import { useToday } from '@/hooks/useToday';
import { dayOfArc } from '@/lib/dates';
import { toRoman } from '@/lib/toRoman';
import { createStyles, SchemeOverride } from '@/theme';

/** Each selfie stays this long: quick enough to see the change, slow enough to see a face. */
const FRAME_MS = 350;
const FRAME_HEIGHT = 440;

const copy = proofCopy.reel;

/**
 * The timelapse: selfies one after another, oldest first. `scope=arc` plays this campaign
 * (from Today and Vidi); `scope=all` plays every selfie ever taken, across arcs (from Vici).
 */
export default function TimelapseScreen() {
  return (
    <SchemeOverride scheme="dark">
      <TimelapseContent />
    </SchemeOverride>
  );
}

function TimelapseContent() {
  const styles = useStyles();
  const params = useLocalSearchParams<{ scope?: string }>();
  const scope: ReelScope = params.scope === 'all' ? 'all' : 'arc';
  const today = useToday();
  const { arc } = useActiveArc();
  const { frames, isLoaded } = useSelfieReel(scope, arc, today);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const count = frames.length;
  const shown = Math.min(index, Math.max(0, count - 1));
  const frame = frames[shown];
  const nextFrame = frames[shown + 1];
  const isAtEnd = shown >= count - 1;
  // Playing stops by itself on the last frame (derived, so no state to reset).
  const isRunning = isPlaying && !isAtEnd && count >= 2;

  // Advance one frame at a time while running.
  useEffect(() => {
    if (!isRunning) return;
    const timer = setTimeout(() => setIndex((current) => current + 1), FRAME_MS);
    return () => clearTimeout(timer);
  }, [isRunning, shown]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

  const togglePlay = () => {
    if (isAtEnd) {
      setIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying(!isRunning);
  };

  const step = (by: number) => {
    setIsPlaying(false);
    setIndex(Math.min(count - 1, Math.max(0, shown + by)));
  };

  const date = frame ? commonCopy.dayLabel(frame.day, today) : '';
  const label =
    frame && scope === 'arc' && arc
      ? copy.frameLabel(toRoman(Math.max(1, dayOfArc(arc.startDay, frame.day))), date)
      : commonCopy.fullDateLabel(frame?.day ?? today);

  return (
    <Screen scroll={false} gutter="none" edges={['top', 'bottom']} background="backgroundDeep">
      <View style={styles.header}>
        <IconButton icon="close" accessibilityLabel={copy.close} onPress={close} />
        <Txt variant="headingSmall" accessibilityRole="header" style={styles.title}>
          {copy.titles[scope].toUpperCase()}
        </Txt>
        <View style={styles.headerSpacer} />
      </View>

      {isLoaded && count < 2 ? (
        <View style={styles.empty}>
          <Txt variant="body" color="textMuted" align="center">
            {copy.tooFew}
          </Txt>
          <Button label={copy.close} variant="secondary" cue={null} onPress={close} />
        </View>
      ) : frame ? (
        <View style={styles.body}>
          <View
            style={styles.frame}
            accessible
            accessibilityLabel={copy.frameAccessibility(date, shown + 1, count)}
          >
            {/* The next photo loads underneath, so the switch never flickers. */}
            {nextFrame ? (
              <Image
                source={{ uri: nextFrame.path }}
                style={[styles.fill, styles.hidden]}
                accessible={false}
              />
            ) : null}
            <Image source={{ uri: frame.path }} style={styles.fill} accessibilityIgnoresInvertColors />
            <View style={styles.labelPlate}>
              <Txt variant="label" color="text">
                {label}
              </Txt>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progress}>
              <ProgressBar
                value={count > 1 ? shown / (count - 1) : 1}
                accessibilityLabel={copy.titles[scope]}
              />
            </View>
            <Txt variant="caption">{copy.counter(shown + 1, count)}</Txt>
          </View>

          <View style={styles.controls}>
            <IconButton icon="back" accessibilityLabel={copy.previous} onPress={() => step(-1)} />
            <View style={styles.play}>
              <Button
                label={isAtEnd ? copy.replay : isRunning ? copy.pause : copy.play}
                cue="tap"
                onPress={togglePlay}
              />
            </View>
            <IconButton icon="forward" accessibilityLabel={copy.next} onPress={() => step(1)} />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.space.sm },
  title: { flex: 1, textAlign: 'center', letterSpacing: 2 },
  headerSpacer: { width: theme.layout.minTouchTarget },
  body: { flex: 1, padding: theme.space.lg, gap: theme.space.lg },
  frame: {
    height: FRAME_HEIGHT,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  hidden: { opacity: 0 },
  labelPlate: {
    position: 'absolute',
    left: theme.space.md,
    bottom: theme.space.md,
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.overlay,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  progress: { flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  play: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', padding: theme.space.xxl, gap: theme.space.lg },
}));
