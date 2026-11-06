/**
 * Features that can be switched off while their UX is settled. Off means hidden and ignored:
 * no screen shows them, and own orders never count toward a day while off.
 * Tests switch them with jest.replaceProperty(FEATURES, 'tasks', false).
 * See docs/ORDERS-AND-TASKS.md.
 */
export const FEATURES = {
  /** The user's own orders (beyond Vinco's four). On since Wave 2 (10 Oct). */
  customOrders: true,
  /** The to-do list: daily and day tasks. On since Wave 2 (10 Oct). */
  tasks: true,
  /** The tone step in onboarding. Off since 2 Nov: new users start in Roast me and can change it in Settings. */
  onboardingTone: false,
};
