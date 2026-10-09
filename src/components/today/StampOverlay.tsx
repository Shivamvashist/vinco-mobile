import { useEffect, type ReactNode } from 'react';
import { Modal, type StyleProp, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { createStyles, themeTiming, useReduceMotion } from '@/theme';

import { Button } from '../Button';
import { StampSlam } from '../StampSlam';
import { Txt } from '../Txt';

export type StampOverlayProps = {
  visible: boolean;
  stampText: string;
  title: string;
  subtitle: string;
  sealLabel: string;
  backLabel: string;
  onSeal: () => void;
  onBack: () => void;
};

const LEAF_COUNT = 10;

/**
 * The VINCO stamp: the one big moment in the app. Shown once per day when all four orders are held.
 * Covers the whole screen, tab bar included.
 */
export function StampOverlay({
  visible,
  stampText,
  title,
  subtitle,
  sealLabel,
  backLabel,
  onSeal,
  onBack,
}: StampOverlayProps) {
  const styles = useStyles();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onBack}
    >
      {visible ? (
        <View style={styles.overlay} accessibilityViewIsModal>
          <StampMoment stampText={stampText} />
          <Rise delay={700}>
            <Txt variant="heading" align="center" accessibilityRole="header" style={styles.title}>
              {title}
            </Txt>
          </Rise>
          <Rise delay={850}>
            <Txt variant="body" color="textMuted" align="center" style={styles.subtitle}>
              {subtitle}
            </Txt>
          </Rise>
          <Rise delay={1000} style={styles.actions}>
            <Button label={sealLabel} cue="confirm" onPress={onSeal} />
            <Button label={backLabel} variant="ghost" cue={null} onPress={onBack} />
          </Rise>
        </View>
      ) : null}
    </Modal>
  );
}

/** The stamp slam and the falling leaves. */
function StampMoment({ stampText }: { stampText: string }) {
  const reduceMotion = useReduceMotion();
  return (
    <>
      {reduceMotion
        ? null
        : Array.from({ length: LEAF_COUNT }, (_, index) => <Leaf key={index} index={index} />)}
      <StampSlam text={stampText} cue="stamp" />
    </>
  );
}

/** One laurel leaf drifting down, spaced and timed like the prototype. */
function Leaf({ index }: { index: number }) {
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const fall = useSharedValue(0);
  const duration = 1800 + (index % 3) * 500;
  const delay = 500 + (index % 4) * 200;

  useEffect(() => {
    fall.value = withDelay(delay, withTiming(1, { duration, easing: Easing.in(Easing.quad) }));
  }, [fall, delay, duration]);

  const fallStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fall.value, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
    transform: [
      { translateY: interpolate(fall.value, [0, 1], [-20, height * 0.6]) },
      { rotate: `${interpolate(fall.value, [0, 1], [0, 260])}deg` },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.leaf, { left: `${8 + index * 9}%` }, fallStyle]} />
  );
}

type RiseProps = {
  delay: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Fades and lifts its content into place after a delay. */
function Rise({ delay, children, style }: RiseProps) {
  const reduceMotion = useReduceMotion();
  const rise = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    rise.value = withDelay(delay, withTiming(1, themeTiming('slow', 'entrance')));
  }, [rise, delay, reduceMotion]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: rise.value,
    transform: [{ translateY: (1 - rise.value) * 12 }],
  }));

  return <Animated.View style={[riseStyle, style]}>{children}</Animated.View>;
}

const useStyles = createStyles((theme) => ({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space.xxxl,
    backgroundColor: theme.colors.overlay,
  },
  // Leaf geometry is illustration, matched to the prototype.
  leaf: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 18,
    borderTopLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: theme.colors.accent,
  },
  title: { marginTop: theme.space.xxxl },
  subtitle: { marginTop: theme.space.sm },
  actions: { alignSelf: 'stretch', marginTop: theme.space.xxl, gap: theme.space.xs },
}));
