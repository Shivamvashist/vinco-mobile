import type { AppDatabase } from './database';
import {
  arcOrders,
  arcs,
  customOrderLogs,
  customOrders,
  dayLogs,
  ledger,
  orderLogs,
  taskCompletions,
  tasks,
  truces,
} from './schema';

/**
 * Deletes every record of the user's journey (arcs, orders, days, tasks, denarii, Truces) in one
 * transaction, keeping the tables. Media files are deleted separately (src/media).
 */
export function clearJourney(db: AppDatabase): void {
  db.transaction((tx) => {
    tx.delete(taskCompletions).run();
    tx.delete(tasks).run();
    tx.delete(customOrderLogs).run();
    tx.delete(customOrders).run();
    tx.delete(truces).run();
    tx.delete(ledger).run();
    tx.delete(orderLogs).run();
    tx.delete(dayLogs).run();
    tx.delete(arcOrders).run();
    tx.delete(arcs).run();
  });
}
