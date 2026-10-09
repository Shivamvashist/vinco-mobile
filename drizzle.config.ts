import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit generates SQL migrations from src/db/schema.ts.
 * After changing the schema: npm run db:generate, then commit the new files in src/db/migrations.
 */
export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
});
