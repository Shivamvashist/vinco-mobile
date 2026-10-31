import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { createStyles, useReduceMotion } from '@/theme';

import { FocusClock } from './FocusClock';

export type DriftingClockProps = {
  remainingMs: number;
  fontSize: number;
};

/** One slow glide to a new spot takes this long, then the next begins. */
const DRIFT_MS = 14_000;

type Size = { width: number; height: number };

/**
 * The screensaver's clock: it glides slowly to a new spot inside the screen every few seconds, so
 * no pixel stays lit in one place (no burn-in), and always stays fully on screen whatever its size.
 * With reduce motion it rests in the centre.
 */
export function DriftingClock({ remainingMs, fontSize }: DriftingClockProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const [stage, setStage] = useState<Size>({ width: 0, height: 0 });
  const [clock, setClock] = useState<Size>({ width: 0, height: 0 });
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const roomX = Math.max(0, stage.width - clock.width);
  const roomY = Math.max(0, stage.height - clock.height);
  const isMeasured = stage.width > 0 && clock.width > 0;

  useEffect(() => {
    if (!isMeasured) return;
    x.set(roomX / 2);
    y.set(roomY / 2);
    if (reduceMotion) return;
    const glide = () => {
      const timing = { duration: DRIFT_MS, easing: Easing.inOut(Easing.quad) };
      x.set(withTiming(Math.random() * roomX, timing));
      y.set(withTiming(Math.random() * roomY, timing));
    };
    glide();
    const timer = setInterval(glide, DRIFT_MS);
    return () => clearInterval(timer);
  }, [isMeasured, roomX, roomY, reduceMotion, x, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: y.get() }] }));

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(event: LayoutChangeEvent) => setStage(event.nativeEvent.layout)}
    >
      <Animated.View
        style={[styles.clock, { opacity: isMeasured ? 1 : 0 }, style]}
        onLayout={(event: LayoutChangeEvent) => setClock(event.nativeEvent.layout)}
      >
        <FocusClock remainingMs={remainingMs} fontSize={fontSize} />
      </Animated.View>
    </View>
  );
}

const useStyles = createStyles(() => ({ clock: { position: 'absolute', top: 0, left: 0 } }));
