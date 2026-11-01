import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Txt } from '@/components/Txt';
import { createStyles, themeSpring, useReduceMotion } from '@/theme';

export type RollingClockProps = {
  /** "mm:ss" or "h:mm:ss". */
  text: string;
  /** Font size of the digits, a share of the ring they sit in. */
  fontSize: number;
};

/**
 * Digit cells are this share of the font size wide, so the clock never jitters as digits change.
 * The glyph itself is drawn in a wider box centred on its cell, so a digit wider than its cell
 * (display faces vary) spills into the spacing instead of being clipped.
 */
const DIGIT_WIDTH = 0.64;
const SEPARATOR_WIDTH = 0.3;
const GLYPH_BOX = 1.2;
/** How far a new digit rises from as it arrives. */
const ROLL_FROM = 0.35;

/**
 * The focus clock in the display face. Each digit sits in a fixed cell and rolls up into place on
 * the `settle` spring when it changes, so only the digits that change move. Decorative for screen
 * readers: the caller labels the time.
 */
export function RollingClock({ text, fontSize }: RollingClockProps) {
  const styles = useStyles();
  // Keyed from the right, so the seconds keep their cells when the hours appear or go.
  const characters = [...text].reverse();
  return (
    <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {characters
        .map((character, indexFromRight) => (
          <RollingCharacter key={indexFromRight} character={character} fontSize={fontSize} />
        ))
        .reverse()}
    </View>
  );
}

function RollingCharacter({ character, fontSize }: { character: string; fontSize: number }) {
  const reduceMotion = useReduceMotion();
  const offset = useSharedValue(0);
  const previous = useRef(character);

  useEffect(() => {
    if (previous.current === character) return;
    previous.current = character;
    if (reduceMotion) return;
    offset.value = 1;
    offset.value = withSpring(0, themeSpring('settle'));
  }, [character, reduceMotion, offset]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - offset.value * 0.8,
    transform: [{ translateY: offset.value * ROLL_FROM * fontSize }],
  }));

  const isDigit = character >= '0' && character <= '9';
  const cell = fontSize * (isDigit ? DIGIT_WIDTH : SEPARATOR_WIDTH);
  const box = fontSize * GLYPH_BOX;
  return (
    <Animated.View style={[{ width: cell, height: fontSize * 1.2 }, style]}>
      <Txt
        variant="numeral"
        align="center"
        numberOfLines={1}
        // Sized from the space it has (the ring), so the phone's font size must not grow it past it.
        maxFontSizeMultiplier={1}
        style={{
          position: 'absolute',
          left: (cell - box) / 2,
          width: box,
          fontSize,
          lineHeight: fontSize * 1.2,
        }}
      >
        {character}
      </Txt>
    </Animated.View>
  );
}

const useStyles = createStyles(() => ({
  // Not clipped: glyphs may run past their cells (see GLYPH_BOX); the roll fades instead.
  row: { flexDirection: 'row', alignItems: 'center' },
}));
