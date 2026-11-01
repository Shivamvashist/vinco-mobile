import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import type { SkyBody } from '@/features/dayPath';
import { useTheme } from '@/theme';

export type SkyGlyphProps = {
  body: SkyBody;
  /** Width and height, in points. */
  size: number;
};

/** The rays' angles, in degrees. */
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * The sun (a disc with eight short rays, in the accent) or the moon (a crescent, in the text
 * colour) that rides the day path in the hero's sky view. Decorative: drawn in a 24 by 24 box.
 */
export function SkyGlyph({ body, size }: SkyGlyphProps) {
  const theme = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body === 'sun' ? (
        <G>
          <Circle cx={12} cy={12} r={5.5} fill={theme.colors.accent} />
          {RAYS.map((angle) => {
            const radians = (angle * Math.PI) / 180;
            const cos = Math.cos(radians);
            const sin = Math.sin(radians);
            return (
              <Line
                key={angle}
                x1={12 + cos * 8}
                y1={12 + sin * 8}
                x2={12 + cos * 10.5}
                y2={12 + sin * 10.5}
                stroke={theme.colors.accent}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
        </G>
      ) : (
        <Path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" fill={theme.colors.text} />
      )}
    </Svg>
  );
}
