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

import { PressableScale } from '@/components/PressableScale';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { clampFocusMinutes, FOCUS_RULES } from '@/features/focus';
import { createStyles, useFeedback, useTheme } from '@/theme';

export type DurationRulerProps = {
  /** Minutes, 5 to 180 in steps of 5. */
  value: number;
  onChange: (minutes: number) => void;
};

const { minMinutes, maxMinutes, stepMinutes, presets } = FOCUS_RULES;
const STEPS = Array.from(
  { length: (maxMinutes - minMinutes) / stepMinutes + 1 },
  (_, i) => minMinutes + i * stepMinutes,
);
/** A taller tick and a label every this many minutes. */
const LABEL_EVERY = 15;

/**
 * The focus length: a big number over a horizontal ruler that snaps every 5 minutes with a
 * selection tick, and quick lengths above it. For screen readers it is one adjustable control
 * (swipe up or down to change it by 5 minutes).
 */
export function DurationRuler({ value, onChange }: DurationRulerProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  // The last value the ruler reported or was moved to, and whether the finger is driving it.
  const shown = useRef(value);
  const isDragging = useRef(false);
  const tick = theme.space.lg;
  const edge = Math.max(0, width / 2 - tick / 2);

  // Moved from outside (a quick length, a screen reader): glide the ruler there.
  useEffect(() => {
    if (width === 0 || value === shown.current) return;
    shown.current = value;
    isDragging.current = false;
    scrollRef.current?.scrollTo({ x: indexOf(value) * tick, animated: true });
  }, [value, width, tick]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isDragging.current) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / tick);
    const minutes = clampFocusMinutes(minMinutes + index * stepMinutes);
    if (minutes === shown.current) return;
    shown.current = minutes;
    play('select');
    onChange(minutes);
  };

  const change = (minutes: number) => {
    const next = clampFocusMinutes(minutes);
    if (next === value) return;
    play('select');
    onChange(next);
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') change(value + stepMinutes);
    if (event.nativeEvent.actionName === 'decrement') change(value - stepMinutes);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.reading} importantForAccessibility="no-hide-descendants">
        <Txt variant="numeral" style={styles.tabular}>
          {value}
        </Txt>
        <Txt variant="headingSmall" color="textMuted">
          {focusCopy.setup.minutesUnit}
        </Txt>
      </View>

      <View
        style={styles.presets}
        accessibilityRole="radiogroup"
        accessibilityLabel={focusCopy.setup.presetsLabel}
      >
        {presets.map((preset) => {
          const isSelected = preset === value;
          return (
            <PressableScale
              key={preset}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={focusCopy.setup.minutes(preset)}
              hitSlop={theme.space.xs}
              onPress={() => change(preset)}
              style={[styles.preset, isSelected && styles.presetSelected]}
            >
              <Txt variant="labelSmall" color={isSelected ? 'text' : 'textMuted'} style={styles.tabular}>
                {preset}
              </Txt>
            </PressableScale>
          );
        })}
      </View>

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={focusCopy.setup.rulerLabel}
        accessibilityHint={focusCopy.setup.rulerHint}
        accessibilityValue={{
          min: minMinutes,
          max: maxMinutes,
          now: value,
          text: focusCopy.setup.minutes(value),
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
            contentOffset={{ x: indexOf(value) * tick, y: 0 }}
            contentContainerStyle={{ paddingHorizontal: edge }}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => {
              isDragging.current = true;
            }}
            onScroll={handleScroll}
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
                    {minutes}
                  </Txt>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : null}
        <EdgeFade width={width} />
        <View style={[styles.needle, { left: width / 2 - theme.layout.borderWidthStrong }]} />
      </View>
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

function indexOf(minutes: number): number {
  return (clampFocusMinutes(minutes) - minMinutes) / stepMinutes;
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.lg },
  reading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: theme.space.sm },
  tabular: { fontVariant: ['tabular-nums'] },
  presets: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: theme.space.sm },
  preset: {
    minWidth: theme.layout.minTouchTarget,
    minHeight: theme.layout.choiceChipHeight,
    paddingHorizontal: theme.space.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
  },
  presetSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentTint },
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
