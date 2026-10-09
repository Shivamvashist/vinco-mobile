/**
 * Features that are built but switched off until their UX is settled. Off means hidden and
 * ignored: no screen shows them, and own orders never count toward a day while off.
 * Tests switch them on with jest.replaceProperty(FEATURES, 'tasks', true).
 * See docs/ORDERS-AND-TASKS.md.
 */
export const FEATURES = {
  /** The user's own orders (beyond Vinco's four). */
  customOrders: false,
  /** The to-do list: daily and day tasks. */
  tasks: false,
};
