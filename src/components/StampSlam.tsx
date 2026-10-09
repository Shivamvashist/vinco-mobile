import { useEffect } from 'react';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { type FeedbackCue, themeEasing, useFeedback, useReduceMotion } from '@/theme';

import { StampMark, type StampMarkProps } from './StampMark';

export type StampSlamProps = StampMarkProps & {
  /** Sound and haptic when the stamp hits. */
  cue: FeedbackCue;
  /** Wait before the slam starts, in milliseconds. */
  delay?: number;
};

/** Timings from the prototype's stamp animation, in milliseconds. */
const SLAM_DURATION_MS = 600;
/** The stamp hits the page 55% into the slam: the moment for the thud. */
const IMPACT_FRACTION = 0.55;

/**
 * The stamp slamming onto the page: drops from large and rotated, overshoots, settles at a tilt.
 * Plays its cue on impact. With reduced motion it simply appears, and the cue plays at once.
 * Plays once per mount: mount it when the moment happens.
 */
export function StampSlam({ cue, delay = 150, ...markProps }: StampSlamProps) {
  const play = useFeedback();
  const reduceMotion = useReduceMotion();
  const slam = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      play(cue);
      return;
    }
    slam.value = withDelay(delay, withTiming(1, { duration: SLAM_DURATION_MS, easing: themeEasing() }));
    const impact = setTimeout(() => play(cue), delay + SLAM_DURATION_MS * IMPACT_FRACTION);
    return () => clearTimeout(impact);
  }, [reduceMotion, play, cue, delay, slam]);

  const slamStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slam.value, [0, 0.3, 1], [0, 1, 1]),
    transform: [
      { scale: interpolate(slam.value, [0, IMPACT_FRACTION, 0.75, 1], [3, 0.92, 1.04, 1]) },
      { rotate: `${interpolate(slam.value, [0, IMPACT_FRACTION, 0.75, 1], [-16, -7, -9, -8])}deg` },
    ],
  }));

  return (
    <Animated.View style={slamStyle}>
      <StampMark {...markProps} />
    </Animated.View>
  );
}
