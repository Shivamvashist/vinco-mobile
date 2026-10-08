/** Corner radius scale. `pill` rounds any height fully (buttons, chips, bars). */
export const radius = {
  none: 0,
  xs: 4,
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
