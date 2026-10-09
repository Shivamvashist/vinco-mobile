import Svg, { Path } from 'react-native-svg';

import { type ColorRole, useTheme } from '@/theme';

/** The wreath from the prototype: two branches meeting at the bottom, three leaves each side. */
const LAUREL_PATHS = [
  'M60 28 C44 26 28 18 14 6',
  'M60 28 C76 26 92 18 106 6',
  'M22 13 q-6 -6 -2 -11 q6 4 2 11z',
  'M33 19 q-7 -4 -5 -10 q7 3 5 10z',
  'M45 24 q-7 -2 -7 -8 q7 1 7 8z',
  'M98 13 q6 -6 2 -11 q-6 4 -2 11z',
  'M87 19 q7 -4 5 -10 q-7 3 -5 10z',
  'M75 24 q7 -2 7 -8 q-7 1 -7 8z',
] as const;

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 32;

export type LaurelProps = {
  width?: number;
  color?: ColorRole;
  /** An exact colour for fixed artwork (the day card), overriding the theme role. */
  strokeColor?: string;
  strokeWidth?: number;
};

/** Laurel wreath, the mark for wins. Decorative. */
export function Laurel({ width = 150, color = 'accent', strokeColor, strokeWidth = 1.4 }: LaurelProps) {
  const theme = useTheme();
  return (
    <Svg
      width={width}
      height={(width * VIEW_HEIGHT) / VIEW_WIDTH}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      fill="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {LAUREL_PATHS.map((d) => (
        <Path
          key={d}
          d={d}
          stroke={strokeColor ?? theme.colors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}
