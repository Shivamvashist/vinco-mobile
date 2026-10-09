/**
 * The phone's database: records the user creates (arcs, order logs, day logs).
 * Screens read with Drizzle live queries; writes go through the functions here.
 * Nothing here is copied into Zustand.
 */
export {
  createArc,
  getActiveArc,
  type NewArc,
  selectActiveArc,
  selectArcOrders,
  toOrderTargets,
} from './arcs';
export { db } from './client';
export { type AppDatabase, nowIso } from './database';
export { getDayLog, selectDayLog, selectRecentSelfies, updateDayLog } from './dayLogs';
export {
  getOrderAmount,
  getOrderLogsForDay,
  saveOrderAmount,
  selectOrderLogsForDay,
  toOrderAmounts,
  toWorkoutNote,
} from './orderLogs';
export type { ArcOrderRow, ArcRow, DayLogRow, LedgerRow, OrderLogRow } from './schema';
export {
  sealFinishedDays,
  selectDayLogsBetween,
  selectLedger,
  selectOrderLogsBetween,
  toDayRecords,
} from './sealing';
export { useDatabaseMigrations } from './useDatabaseMigrations';
