import { type StyleProp, type TextStyle, View } from 'react-native';
import { useState } from 'react';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { useFitFontSize } from '@/hooks/useFitFontSize';
import { type ColorRole, createStyles, motion, type TextVariant, useReduceMotion, useTheme } from '@/theme';

import { Txt } from './Txt';

export type RollingNumberProps = {
  /** The text to show: "12", "6:30", "1,240". A change rolls the old one up and the new one in. */
  value: string;
  variant?: TextVariant;
  color?: ColorRole;
  style?: StyleProp<TextStyle>;
  /** What a screen reader says, when the bare value isn't enough. */
  accessibilityLabel?: string;
  /**
   * Shrink to fit the width it is given, measured with the real font, so a long value ("1:30" in a
   * narrow tile, large text) never clips. The number then fills its parent's width.
   */
  fit?: boolean;
};

/** The new value rises in on the settle spring; the old one lifts away quickly. */
const ENTER = FadeInDown.springify()
  .damping(motion.spring.settle.damping)
  .stiffness(motion.spring.settle.stiffness)
  .mass(motion.spring.settle.mass);
const EXIT = FadeOutUp.duration(motion.duration.fast);

/**
 * A number that rolls when it changes, like a mechanical counter: the hero count, the run, the
 * purse. Keyed by value, so each change is one short, interruptible motion. With reduce motion
 * on it simply changes.
 */
export function RollingNumber({
  value,
  variant = 'numeral',
  color,
  style,
  accessibilityLabel,
  fit = false,
}: RollingNumberProps) {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const type = theme.type[variant];
  const baseSize = type.fontSize ?? 16;
  const lineRatio = (type.lineHeight ?? baseSize * 1.2) / baseSize;
  const fitted = useFitFontSize(baseSize);
  const fitStyle = fit ? { fontSize: fitted.fontSize, lineHeight: fitted.fontSize * lineRatio } : null;
  // The first value is simply there: an entrance on mount starts at opacity 0 and can stall when
  // the app opens from the background, leaving the number blank. Only a changed value rolls in.
  const [firstValue] = useState(value);
  const [hasChanged, setHasChanged] = useState(false);
  if (!hasChanged && value !== firstValue) setHasChanged(true);
  const animate = hasChanged && !reduceMotion;

  return (
    <View
      style={[styles.clip, fit && styles.stretch]}
      onLayout={fit ? fitted.onBoxLayout : undefined}
      accessible
      accessibilityLabel={accessibilityLabel ?? value}
      accessibilityLiveRegion="polite"
    >
      {fit ? (
        // Measured at the full size on one unbounded line, never seen.
        <View style={styles.measure} pointerEvents="none" importantForAccessibility="no-hide-descendants">
          <Txt
            variant={variant}
            numberOfLines={1}
            onTextLayout={fitted.onMeasureLayout}
            style={[{ fontVariant: ['tabular-nums'] }, style]}
          >
            {value}
          </Txt>
        </View>
      ) : null}
      <Animated.View key={value} entering={animate ? ENTER : undefined} exiting={animate ? EXIT : undefined}>
        <Txt
          variant={variant}
          color={color}
          numberOfLines={fit ? 1 : undefined}
          style={[{ fontVariant: ['tabular-nums'] }, style, fitStyle]}
        >
          {value}
        </Txt>
      </Animated.View>
    </View>
  );
}

const useStyles = createStyles(() => ({
  clip: { overflow: 'hidden' },
  stretch: { alignSelf: 'stretch' },
  // Wide enough that the measuring line never wraps; invisible and out of the layout.
  measure: { position: 'absolute', left: 0, top: 0, width: 4000, opacity: 0 },
}));
