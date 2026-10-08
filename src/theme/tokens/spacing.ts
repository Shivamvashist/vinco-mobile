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

/** Fixed sizes for recurring layout pieces, taken from the UI prototype. */
export const layout = {
  /** Side padding on tab screens. */
  screenGutter: 20,
  /** Side padding on onboarding and full-screen flows. */
  flowGutter: 24,
  /** Inner padding of cards and task rows. */
  cardPadding: 14,
  /** Smallest tappable size, per platform accessibility guidance. */
  minTouchTarget: 44,
  buttonHeight: 56,
  buttonHeightCompact: 48,
  tabBarHeight: 76,
  iconSize: 22,
  iconSizeSmall: 16,
  borderWidth: 1,
  borderWidthStrong: 1.5,
  hairline: StyleSheet.hairlineWidth,
} as const;

export type SpaceToken = keyof typeof space;
