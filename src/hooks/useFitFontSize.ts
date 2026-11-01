import { useState } from 'react';
import type { LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

export type FitFontSize = {
  /** The size to draw at: the base size, or smaller when the text wouldn't fit. */
  fontSize: number;
  /** Give it the box the text must fit in (its width). */
  onBoxLayout: (event: LayoutChangeEvent) => void;
  /** Give it the hidden measuring text, drawn at the base size on one unbounded line. */
  onMeasureLayout: (event: NativeSyntheticEvent<TextLayoutEventData>) => void;
};

/** Never shrink below this share of the base size: past it, the layout needs rethinking. */
const MIN_SCALE = 0.5;
/** A little room for glyphs whose ink runs past their advance (display faces do). */
const SAFETY = 0.96;

/**
 * Shrinks a line of text just enough to fit its box, measured on the phone with the real font,
 * so big numbers never clip (Android's adjustsFontSizeToFit is unreliable with custom fonts).
 * Pair it with FitText, or wire the two layouts yourself.
 */
export function useFitFontSize(baseSize: number): FitFontSize {
  const [boxWidth, setBoxWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const needed = textWidth / SAFETY;
  const scale = boxWidth > 0 && needed > boxWidth ? Math.max(MIN_SCALE, boxWidth / needed) : 1;
  return {
    fontSize: Math.floor(baseSize * scale * 10) / 10,
    onBoxLayout: (event) => setBoxWidth(event.nativeEvent.layout.width),
    onMeasureLayout: (event) => {
      const width = event.nativeEvent.lines.reduce((widest, line) => Math.max(widest, line.width), 0);
      setTextWidth(width);
    },
  };
}
