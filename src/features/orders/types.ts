/** The four non-negotiable orders, in the order they appear on Today. */
export const ORDER_KINDS = ['water', 'wake', 'meal', 'workout'] as const;

export type OrderKind = (typeof ORDER_KINDS)[number];

/** none: not started. min: the line is held (campaign safe). full: conquered (laurel). */
export type OrderStatus = 'none' | 'min' | 'full';

/**
 * What one order asks for. Every order is an amount measured against a minimum and a full goal:
 * water in litres, meals as a count, wake-up as 0 or 1, workout in minutes.
 */
export type OrderTarget = {
  /** Hold the line: reaching this keeps the campaign alive. */
  min: number;
  /** Conquer: reaching this earns the laurel. */
  full: number;
  /** How much one tap adds. */
  step: number;
};

export type OrderTargets = Record<OrderKind, OrderTarget>;

/** Today's amount for each order. */
export type OrderAmounts = Record<OrderKind, number>;
