import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

/**
 * Any synchronous Drizzle SQLite database with Vinco's schema: expo-sqlite on the phone,
 * better-sqlite3 in tests. Repository functions take one of these, so they run the same in both.
 */
export type AppDatabase = BaseSQLiteDatabase<'sync', any, typeof schema>;

/** Now as an ISO timestamp. Passed in by callers so tests can control time. */
export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}
