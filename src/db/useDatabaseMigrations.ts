import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from './client';
import migrations from './migrations/migrations';

/**
 * Brings the phone's database up to the current schema. Each migration runs once.
 * The root layout keeps the splash up until this succeeds, and shows a recovery screen if it fails.
 */
export function useDatabaseMigrations(): { isReady: boolean; error: Error | undefined } {
  const { success, error } = useMigrations(db, migrations);
  return { isReady: success, error };
}
