import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { createStyles, useReduceMotion, useTheme } from '@/theme';

/** One wave length of the path; the loop shifts by exactly this, so it never jumps. */
const WAVE_LENGTH = 120;
const WIDTH = 520;
const HEIGHT = 40;
const FLOW_DURATION_MS = 6000;

const UPPER_WAVE = 'M0 20 Q30 8 60 20 T120 20 T180 20 T240 20 T300 20 T360 20 T420 20 T480 20 T540 20';
const LOWER_WAVE = 'M0 30 Q30 20 60 30 T120 30 T180 30 T240 30 T300 30 T360 30 T420 30 T480 30 T540 30';

/** The Rubicon: two lines flowing left, edge to edge. Decorative; still with reduced motion. */
export function RiverLines() {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const offset = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(offset);
      offset.value = 0;
      return;
    }
    offset.value = withRepeat(
      withTiming(-WAVE_LENGTH, { duration: FLOW_DURATION_MS, easing: Easing.linear }),
      -1,
    );
    return () => cancelAnimation(offset);
  }, [reduceMotion, offset]);

  const flowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <View style={styles.frame} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Animated.View style={flowStyle}>
        <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          <Path d={UPPER_WAVE} fill="none" stroke={theme.colors.border} strokeWidth={2} />
          <Path d={LOWER_WAVE} fill="none" stroke={theme.colors.surfaceRaised} strokeWidth={2} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  // Bleeds past the screen gutters so the river runs edge to edge.
  frame: {
    height: HEIGHT,
    overflow: 'hidden',
    marginHorizontal: -theme.layout.flowGutter,
  },
}));
