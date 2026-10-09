import Svg, { Path } from 'react-native-svg';

import { type ColorRole, useTheme } from '@/theme';

/**
 * The prototype's line icons on a 24 by 24 grid. Shapes are paths only (rects and
 * circles converted), so every icon draws the same way.
 */
const ICON_PATHS = {
  water: 'M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z',
  sunrise: 'M3 17h18M7 17a5 5 0 0 1 10 0M12 4v3M5 9l2 1.5M19 9l-2 1.5',
  meal: 'M4 12h16a8 8 0 0 1-16 0zM9 8c0-2 2-2 2-4M13 8c0-2 2-2 2-4',
  workout: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  flame: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
  book: 'M6 4h10a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H8a2 2 0 0 1-2-2zM6 18a2 2 0 0 1 2-2h10M9 8h6M9 11h4',
  helmet: 'M5 14a7 7 0 0 1 14 0v4H5zM12 7V3M8 3h8M9 18v3M15 18v3',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM15.5 13a3.5 3.5 0 1 1-7 0a3.5 3.5 0 1 1 7 0z',
  flipCamera: 'M4 8h3l2-3h6l2 3h3v11H4zM9 13a3 3 0 0 1 5-2M15 13a3 3 0 0 1-5 2M14 9v2h-2M10 17v-2h2',
  list: 'M5 6h14M5 12h14M5 18h9',
  lock: 'M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  back: 'M15 5l-7 7 7 7',
  forward: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  scale:
    'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM8 10a4 4 0 0 1 8 0M12 10l1.5-2',
  moon: 'M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z',
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M8.5 5.5v13M15.5 5.5v13',
  replay: 'M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4',
} as const;

export type IconName = keyof typeof ICON_PATHS;

/** Every icon name, for galleries and tests. */
export const ICON_NAMES = Object.keys(ICON_PATHS) as IconName[];

export type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorRole;
  strokeWidth?: number;
  /** Pass only when the icon carries meaning on its own. Otherwise it is hidden from screen readers. */
  accessibilityLabel?: string;
};

export function Icon({ name, size, color = 'text', strokeWidth = 1.8, accessibilityLabel }: IconProps) {
  const theme = useTheme();
  const dimension = size ?? theme.layout.iconSize;
  const isDecorative = accessibilityLabel == null;

  return (
    <Svg
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      accessible={!isDecorative}
      accessibilityRole={isDecorative ? undefined : 'image'}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={isDecorative ? 'no-hide-descendants' : 'yes'}
    >
      <Path
        d={ICON_PATHS[name]}
        stroke={theme.colors[color]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
