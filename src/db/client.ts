import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const DATABASE_NAME = 'vinco.db';

/**
 * The app's database on the phone. The change listener lets Drizzle live queries
 * re-render screens whenever a row they read changes.
 */
const expoDatabase = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

export const db = drizzle(expoDatabase, { schema });
