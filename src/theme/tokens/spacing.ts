import { StyleSheet } from 'react-native';

/**
 * Spacing scale for padding, margin and gap.
 * Never use a raw number for spacing in a component; pick the nearest step.
 */
export const space = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  giant: 64,
} as const;

/**
 * Sizes for recurring layout pieces, from the UI prototype, trimmed for real phones (13 Oct).
 * The theme scales them to the window width (tokens/scale.ts), so they are design sizes.
 */
export const layout = {
  /** Side padding on tab screens. */
  screenGutter: 18,
  /** Side padding on onboarding and full-screen flows. */
  flowGutter: 22,
  /** Inner padding of cards and task rows. */
  cardPadding: 12,
  /** Smallest tappable size, per platform accessibility guidance. */
  minTouchTarget: 44,
  buttonHeight: 52,
  buttonHeightCompact: 44,
  buttonHeightLarge: 58,
  chipHeight: 30,
  choiceChipHeight: 36,
  statusCircleSize: 28,
  ringSize: 58,
  ringStrokeWidth: 5,
  barHeightThin: 3,
  barHeightRegular: 5,
  barHeightThick: 6,
  sheetPadding: 20,
  stampBorderWidth: 4,
  stampBorderWidthLarge: 5,
  tabBarHeight: 70,
  iconSize: 22,
  iconSizeSmall: 16,
  /** Square tile behind an order's icon. */
  iconTileSize: 34,
  borderWidth: 1,
  borderWidthStrong: 1.5,
  hairline: StyleSheet.hairlineWidth,
} as const;

export type SpaceToken = keyof typeof space;
