/**
 * TESTS ONLY. A real SQLite database in memory (better-sqlite3) with Vinco's migrations applied,
 * so repository, hook and screen tests run real SQL. Never imported by the app.
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';

import type { AppDatabase } from '../database';
import * as schema from '../schema';

const MIGRATIONS_FOLDER = path.join(__dirname, '..', 'migrations');
const WRITE_STATEMENT = /^\s*(insert|update|delete)/i;

const listeners = new Set<() => void>();

/** Called after any write, so the test version of useLiveQuery can re-render. */
export function subscribeToTestWrites(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A fresh, migrated, empty database. */
export function createTestDatabase(): AppDatabase {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, {
    schema,
    logger: {
      // Logged just before the statement runs; listeners re-render afterwards, seeing the new rows.
      logQuery(query) {
        if (WRITE_STATEMENT.test(query)) listeners.forEach((listener) => listener());
      },
    },
  });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
}

/** Empties every table, keeping the schema. Run between tests. */
export function clearTestDatabase(db: AppDatabase): void {
  db.delete(schema.taskCompletions).run();
  db.delete(schema.tasks).run();
  db.delete(schema.customOrderLogs).run();
  db.delete(schema.customOrders).run();
  db.delete(schema.truces).run();
  db.delete(schema.ledger).run();
  db.delete(schema.orderLogs).run();
  db.delete(schema.dayLogs).run();
  db.delete(schema.arcOrders).run();
  db.delete(schema.arcs).run();
}
