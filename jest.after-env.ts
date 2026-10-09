/**
 * Runs before each test file, after Jest's test functions exist.
 * Every test starts with an empty database.
 */
import { db } from '@/db/client';
import { clearTestDatabase } from '@/db/testing/testDatabase';

beforeEach(() => {
  clearTestDatabase(db);
});
