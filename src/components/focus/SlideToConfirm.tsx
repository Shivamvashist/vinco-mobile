import { useState } from 'react';
import { type AccessibilityActionEvent, type LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { createStyles, themeSpring, useReduceMotion, useTheme } from '@/theme';

export type SlideToConfirmProps = {
  label: string;
  /** Says what sliding does (and what it costs). */
  accessibilityHint: string;
  /** Runs once the knob reaches the end (or a screen reader activates it). */
  onConfirm: () => void;
  /** accent: begin. danger: retreat. */
  tone?: 'accent' | 'danger';
  icon?: IconName;
  disabled?: boolean;
};

/** Past this share of the track, letting go completes the slide; before it, the knob springs back. */
const COMPLETE_AT = 0.85;

/**
 * A track with a knob the thumb drags to the end: a deliberate act, not a tap (beginning or leaving
 * a focus). It snaps back unless let go past 85%. Screen readers get one "activate" action that
 * confirms directly. The caller plays the cue (and its haptic) for what was confirmed.
 */
export function SlideToConfirm({
  label,
  accessibilityHint,
  onConfirm,
  tone = 'accent',
  icon = 'forward',
  disabled = false,
}: SlideToConfirmProps) {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const offset = useSharedValue(0);
  const knob = theme.layout.buttonHeight;
  const inset = theme.space.xs;
  const travel = Math.max(0, trackWidth - knob - inset * 2);
  const fill = tone === 'danger' ? theme.colors.danger : theme.colors.accent;

  const confirm = () => {
    if (disabled) return;
    onConfirm();
  };

  const pan = Gesture.Pan()
    .enabled(!disabled && travel > 0)
    .activeOffsetX([-8, 8])
    .onUpdate((event) => {
      offset.set(Math.min(travel, Math.max(0, event.translationX)));
    })
    .onEnd(() => {
      if (offset.get() >= travel * COMPLETE_AT) {
        offset.set(travel);
        scheduleOnRN(confirm);
        // Back to the start, ready for next time, once the caller has moved on.
        offset.set(reduceMotion ? 0 : withSpring(0, themeSpring('settle')));
        return;
      }
      offset.set(reduceMotion ? 0 : withSpring(0, themeSpring('press')));
    });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));
  const trailStyle = useAnimatedStyle(() => ({ width: offset.get() + knob + inset }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.get(), [0, Math.max(1, travel * 0.6)], [1, 0], Extrapolation.CLAMP),
  }));

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'activate') confirm();
  };

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'activate', label }]}
      onAccessibilityAction={handleAccessibilityAction}
      onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
      style={[styles.track, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.trail, { backgroundColor: fill }, trailStyle]} />
      <Animated.View style={[styles.labelWrap, labelStyle]} pointerEvents="none">
        <Txt variant="button" color="textMuted" numberOfLines={1}>
          {label}
        </Txt>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.knob, { width: knob, height: knob, backgroundColor: fill }, knobStyle]}>
          <Icon
            name={icon}
            size={theme.layout.iconSize}
            strokeWidth={2.4}
            color={tone === 'danger' ? 'background' : 'onAccent'}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  track: {
    height: theme.layout.buttonHeight + theme.space.xs * 2,
    padding: theme.space.xs,
    borderRadius: theme.radius.pill,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
    backgroundColor: theme.colors.surfaceSunk,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  disabled: { opacity: 0.5 },
  trail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: theme.radius.pill,
    opacity: 0.22,
  },
  labelWrap: {
    position: 'absolute',
    left: theme.layout.buttonHeight + theme.space.md,
    right: theme.space.lg,
    alignItems: 'center',
  },
  knob: {
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
