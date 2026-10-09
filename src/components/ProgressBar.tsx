import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { clampProgress, normaliseSegments } from '@/lib/progress';
import { type ColorRole, createStyles, themeTiming, useTheme, useReduceMotion } from '@/theme';

type ProgressBarBaseProps = {
  /** thin 3 (step indicator), regular 5 (water, rank), thick 6 (timelapse). */
  size?: 'thin' | 'regular' | 'thick';
  color?: ColorRole;
  accessibilityLabel?: string;
};

export type ProgressBarProps = ProgressBarBaseProps &
  (
    | { /** 0 to 1. */ value: number; segments?: never }
    | { segments: { total: number; filled: number }; value?: never }
  );

/** A continuous bar (`value`) or a row of segments (`segments`). Animates changes. */
export function ProgressBar(props: ProgressBarProps) {
  const { size = 'regular', color = 'accent', accessibilityLabel } = props;
  const styles = useStyles();

  if (props.segments) {
    const { total, filled } = normaliseSegments(props.segments.total, props.segments.filled);
    return (
      <View
        style={[styles.segmentRow, size === 'thin' ? styles.segmentGapWide : styles.segmentGap]}
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max: total, now: filled }}
      >
        {Array.from({ length: total }, (_, index) => (
          <Segment key={index} isFilled={index < filled} size={size} color={color} />
        ))}
      </View>
    );
  }

  return (
    <ContinuousBar value={props.value} size={size} color={color} accessibilityLabel={accessibilityLabel} />
  );
}

type SegmentProps = {
  isFilled: boolean;
  size: NonNullable<ProgressBarBaseProps['size']>;
  color: ColorRole;
};

function Segment({ isFilled, size, color }: SegmentProps) {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const fill = useSharedValue(isFilled ? 1 : 0);
  const trackColor = theme.colors.border;
  const fillColor = theme.colors[color];

  useEffect(() => {
    const target = isFilled ? 1 : 0;
    fill.value = reduceMotion ? target : withTiming(target, themeTiming('fast'));
  }, [isFilled, reduceMotion, fill]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fill.value, [0, 1], [trackColor, fillColor]),
  }));

  return <Animated.View style={[styles.segment, styles[size], animatedStyle]} />;
}

type ContinuousBarProps = ProgressBarBaseProps & { value: number };

function ContinuousBar({
  value,
  size = 'regular',
  color = 'accent',
  accessibilityLabel,
}: ContinuousBarProps) {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const progress = clampProgress(value);
  const width = useSharedValue(progress);

  useEffect(() => {
    width.value = reduceMotion ? progress : withTiming(progress, themeTiming('base'));
  }, [progress, reduceMotion, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      style={[styles.track, styles[size]]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View
        style={[styles.fill, styles[size], { backgroundColor: theme.colors[color] }, fillStyle]}
      />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  fill: { borderRadius: theme.radius.pill },
  segmentRow: { flexDirection: 'row' },
  segmentGap: { gap: theme.space.xs },
  segmentGapWide: { gap: theme.space.sm },
  segment: { flex: 1, borderRadius: theme.radius.pill },
  thin: { height: theme.layout.barHeightThin },
  regular: { height: theme.layout.barHeightRegular },
  thick: { height: theme.layout.barHeightThick },
}));
