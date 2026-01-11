/**
 * Test Helper Utilities
 * 
 * Provides cleanup functions for test isolation
 * DB connection is managed by global-setup.ts
 */

import { sql } from "drizzle-orm";
import { afterEach } from "vitest";
import { testDb, TEST_TEAMS } from "../test/global-setup.js";

// Re-export for convenience
export { TEST_TEAMS };

/**
 * Clean non-team test data from database
 * Ensures test isolation between tests
 * 
 * NOTE: Teams are NOT cleaned as they are shared across all tests
 */
export async function cleanupTestData() {
  await testDb.execute(sql`
    TRUNCATE TABLE 
      attendances,
      taggables,
      events,
      players,
      labels,
      tags,
      places,
      users
    RESTART IDENTITY CASCADE
  `);
}

/**
 * Hook for Repository tests
 * 
 * - Uses shared testDb from global-setup
 * - Cleans non-team data after each test for isolation
 * - Teams are shared (created in global setup)
 *
 * Usage:
 *   const getDb = useTestDb();
 *   let repo: LabelRepository;
 *
 *   beforeEach(() => {
 *     repo = new LabelRepository(getDb());
 *   });
 */
export function useTestDb() {
  afterEach(async () => {
    await cleanupTestData();
  });

  return () => testDb;
}
