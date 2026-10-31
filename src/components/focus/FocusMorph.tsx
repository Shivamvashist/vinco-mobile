import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { type LayoutChangeEvent, Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  type AnimatedRef,
  Extrapolation,
  interpolate,
  interpolateColor,
  measure,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { createStyles, themeSpring, useReduceMotion, useTheme } from '@/theme';

export type FocusMorphProps = {
  /** The view the surface grows out of and collapses back into (the focus CTA). */
  anchorRef: AnimatedRef<View>;
  /** The anchor's corner radius, so the first and last frames match it exactly. */
  anchorRadius: number;
  /** True opens; false collapses back into the anchor, then calls onClosed. */
  isOpen: boolean;
  onClosed: () => void;
  /** The Android back button. */
  onRequestClose: () => void;
  children: ReactNode;
};

type Frame = { x: number; y: number; width: number; height: number };

/** The content waits until the surface is this far open, then fades and rises in. */
const CONTENT_FROM = 0.6;
/** How far the content rises while it fades in. */
const CONTENT_RISE = 24;

/**
 * A full-screen surface that springs out of an anchor's exact frame (position, size and corner
 * radius on the `morph` spring) and back into it. It sits in a transparent Modal, so it covers the
 * tab bar and the status bar. Interruptible: reversing mid-flight picks up from where it is.
 * With reduce motion on, it appears and disappears at once.
 */
export function FocusMorph({
  anchorRef,
  anchorRadius,
  isOpen,
  onClosed,
  onRequestClose,
  children,
}: FocusMorphProps) {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);
  const origin = useSharedValue<Frame>({ x: 0, y: 0, width: 0, height: 0 });
  const window = useWindowDimensions();
  // The window until the full-screen layer reports its own size (edge to edge, they match).
  const stage = useSharedValue({ width: window.width, height: window.height });
  const { surface, background, border } = theme.colors;
  // The latest onClosed, so a new callback from the parent never restarts the motion.
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  });
  const notifyClosed = useCallback(() => onClosedRef.current(), []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    stage.value = { width, height };
  };

  useEffect(() => {
    const target = isOpen ? 1 : 0;
    const spring = themeSpring('morph');
    scheduleOnUI(() => {
      'worklet';
      const measured = measure(anchorRef);
      if (measured && measured.width > 0 && measured.height > 0) {
        origin.value = {
          x: measured.pageX,
          y: measured.pageY,
          width: measured.width,
          height: measured.height,
        };
      } else if (origin.value.width === 0) {
        // The anchor is off screen: grow from a small card at the bottom centre instead.
        const size = stage.value;
        origin.value = {
          x: size.width * 0.25,
          y: size.height * 0.8,
          width: size.width * 0.5,
          height: size.height * 0.1,
        };
      }
      if (reduceMotion) {
        progress.value = target;
        if (target === 0) scheduleOnRN(notifyClosed);
        return;
      }
      progress.value = withSpring(target, spring, (finished) => {
        if (finished && target === 0) scheduleOnRN(notifyClosed);
      });
    });
  }, [isOpen, reduceMotion, anchorRef, notifyClosed, origin, progress, stage]);

  const surfaceStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const from = origin.value;
    const to = stage.value;
    return {
      left: from.x * (1 - p),
      top: from.y * (1 - p),
      width: Math.max(0, from.width + (to.width - from.width) * p),
      height: Math.max(0, from.height + (to.height - from.height) * p),
      borderRadius: Math.max(0, anchorRadius * (1 - p)),
      backgroundColor: interpolateColor(p, [0, 1], [surface, background]),
      borderColor: interpolateColor(p, [0, 1], [border, background]),
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [CONTENT_FROM, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [CONTENT_FROM, 1], [CONTENT_RISE, 0], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onRequestClose}
    >
      <View style={styles.stage} onLayout={handleLayout}>
        <Animated.View style={[styles.surface, surfaceStyle]} />
        <Animated.View
          accessibilityViewIsModal
          style={[StyleSheet.absoluteFill, { pointerEvents: isOpen ? 'auto' : 'none' }, contentStyle]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const useStyles = createStyles((theme) => ({
  stage: { flex: 1 },
  surface: {
    position: 'absolute',
    borderWidth: theme.layout.hairline,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
}));
