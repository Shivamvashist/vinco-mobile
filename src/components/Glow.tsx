import { useEffect, useId } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { type ColorRole, themeTiming, useReduceMotion, useTheme } from '@/theme';

export type GlowProps = {
  /** The light's colour role: the accent for the hero, info or currency for the tiles. */
  color: ColorRole;
  /** 0 (off) to 1 (full). Changes ease, so a day turning held warms up rather than flicks. */
  intensity: number;
  /** Where the light rises from: the bottom (hero) or a corner (tiles). */
  origin?: 'bottom' | 'bottomRight' | 'bottomLeft';
};

const CENTRES = {
  bottom: { cx: '50%', cy: '115%', rx: '85%', ry: '95%' },
  bottomRight: { cx: '100%', cy: '110%', rx: '95%', ry: '95%' },
  bottomLeft: { cx: '0%', cy: '110%', rx: '95%', ry: '95%' },
} as const;

/**
 * A soft light rising behind a card, in a palette colour, so every palette gets its own glow.
 * Drawn once as an SVG gradient; only its opacity animates (on the UI thread).
 */
export function Glow({ color, intensity, origin = 'bottom' }: GlowProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const id = useId().replace(/:/g, '');
  // Softer on light palettes, where a full-strength glow reads as a stain (theme effects).
  const target = intensity * theme.effects.glowStrength;
  const opacity = useSharedValue(target);
  const centre = CENTRES[origin];

  useEffect(() => {
    opacity.set(reduceMotion ? target : withTiming(target, themeTiming('slower')));
  }, [target, reduceMotion, opacity]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fade]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx={centre.cx} cy={centre.cy} rx={centre.rx} ry={centre.ry}>
            <Stop offset="0" stopColor={theme.colors[color]} stopOpacity={0.55} />
            <Stop offset="0.45" stopColor={theme.colors[color]} stopOpacity={0.2} />
            <Stop offset="1" stopColor={theme.colors[color]} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
