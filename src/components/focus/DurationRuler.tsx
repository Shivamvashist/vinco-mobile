import { useEffect, useRef, useState } from 'react';
import {
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { FOCUS_RULES, minutesAtOffset, rulerIndex, snapRulerMinutes } from '@/features/focus';
import { createStyles, useFeedback, useTheme } from '@/theme';

export type DurationRulerProps = {
  /** Minutes, 5 to 180 (a custom length may sit between the ruler's 5-minute ticks). */
  value: number;
  onChange: (minutes: number) => void;
};

const { minMinutes, maxMinutes, stepMinutes } = FOCUS_RULES;
const STEPS = Array.from(
  { length: (maxMinutes - minMinutes) / stepMinutes + 1 },
  (_, i) => minMinutes + i * stepMinutes,
);
/** A taller tick and a label every this many minutes. */
const LABEL_EVERY = 15;
/** A drag that ends without a fling: wait this long for momentum before calling the scroll over. */
const SETTLE_MS = 250;

/**
 * The ruler: 5 minutes to 3 hours in 5-minute ticks, scrolled under a fixed needle. The value is
 * read from the scroll offset on every scroll event while the user moves it, and again when the
 * drag ends, the fling ends and the snap lands, so the readout always shows the tick under the
 * needle. A value set from outside (a preset, a custom length) glides the ruler there without
 * being overwritten on the way. Screen readers get one adjustable control (5 minutes a swipe).
 */
export function DurationRuler({ value, onChange }: DurationRulerProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  // The finger (or its fling) moves the ruler: only then does the offset decide the value.
  const isUserScrolling = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastReported = useRef(value);
  const tick = theme.space.lg;
  const edge = Math.max(0, width / 2 - tick / 2);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  // Set from outside: glide the ruler to the nearest tick.
  useEffect(() => {
    if (width === 0 || isUserScrolling.current || value === lastReported.current) return;
    lastReported.current = value;
    scrollRef.current?.scrollTo({ x: rulerIndex(value) * tick, animated: true });
  }, [value, width, tick]);

  const report = (offsetX: number) => {
    const minutes = minutesAtOffset(offsetX, tick);
    if (minutes === lastReported.current) return;
    lastReported.current = minutes;
    play('select');
    onChange(minutes);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isUserScrolling.current) report(event.nativeEvent.contentOffset.x);
  };

  const handleEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    report(event.nativeEvent.contentOffset.x);
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, SETTLE_MS);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isUserScrolling.current) return;
    report(event.nativeEvent.contentOffset.x);
    clearTimeout(settleTimer.current);
    isUserScrolling.current = false;
  };

  const change = (minutes: number) => {
    const next = snapRulerMinutes(minutes);
    if (next === value) return;
    play('select');
    onChange(next);
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') change(snapRulerMinutes(value) + stepMinutes);
    if (event.nativeEvent.actionName === 'decrement') change(snapRulerMinutes(value) - stepMinutes);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={focusCopy.setup.rulerLabel}
      accessibilityHint={focusCopy.setup.rulerHint}
      accessibilityValue={{
        min: minMinutes,
        max: maxMinutes,
        now: value,
        text: focusCopy.spokenDuration(value),
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={styles.ruler}
    >
      {width > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={tick}
          decelerationRate="fast"
          contentOffset={{ x: rulerIndex(value) * tick, y: 0 }}
          contentContainerStyle={{ paddingHorizontal: edge }}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            clearTimeout(settleTimer.current);
            isUserScrolling.current = true;
          }}
          onMomentumScrollBegin={() => clearTimeout(settleTimer.current)}
          onScroll={handleScroll}
          onScrollEndDrag={handleEndDrag}
          onMomentumScrollEnd={handleMomentumEnd}
          importantForAccessibility="no-hide-descendants"
        >
          {STEPS.map((minutes) => (
            <View key={minutes} style={[styles.tickCell, { width: tick }]}>
              <View style={minutes % LABEL_EVERY === 0 ? styles.tickMajor : styles.tickMinor} />
              {minutes % LABEL_EVERY === 0 ? (
                <Txt
                  variant="micro"
                  style={[styles.tickLabel, { width: tick * 3, left: -tick }]}
                  align="center"
                >
                  {focusCopy.shortDuration(minutes)}
                </Txt>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}
      <EdgeFade width={width} />
      <View style={[styles.needle, { left: width / 2 - theme.layout.borderWidthStrong }]} />
    </View>
  );
}

/** Ticks fade into the background at both ends, so the ruler reads as endless. */
function EdgeFade({ width }: { width: number }) {
  const theme = useTheme();
  if (width === 0) return null;
  const fade = width * 0.22;
  const color = theme.colors.background;
  return (
    <Svg width={width} height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="rulerFadeLeft" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={1} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="rulerFadeRight" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="1" stopColor={color} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={fade} height="100%" fill="url(#rulerFadeLeft)" />
      <Rect x={width - fade} y={0} width={fade} height="100%" fill="url(#rulerFadeRight)" />
    </Svg>
  );
}

const useStyles = createStyles((theme) => ({
  ruler: { height: theme.space.giant, justifyContent: 'flex-start' },
  tickCell: { height: theme.space.giant, alignItems: 'center' },
  tickMinor: {
    marginTop: theme.space.md,
    width: theme.layout.borderWidth,
    height: theme.space.md,
    backgroundColor: theme.colors.borderStrong,
  },
  tickMajor: {
    marginTop: theme.space.sm,
    width: theme.layout.borderWidthStrong,
    height: theme.space.xl,
    backgroundColor: theme.colors.textMuted,
  },
  tickLabel: { position: 'absolute', top: theme.space.xxxl },
  needle: {
    position: 'absolute',
    top: theme.space.xs,
    width: theme.layout.borderWidthStrong * 2,
    height: theme.space.xxl + theme.space.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
}));
