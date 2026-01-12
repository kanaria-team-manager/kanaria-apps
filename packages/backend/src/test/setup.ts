/**
 * Vitest Setup File
 * Runs before each test file in the same context as tests
 *
 * Responsibilities:
 * - Establish DB connection for this test file
 * - Export helper functions to access the DB
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll } from "vitest";
import * as schema from "../db/schemas/index.js";

// Re-export TEST_TEAMS from global-setup for convenience
export { TEST_TEAMS } from "./global-setup.js";

// Shared DB connection (used across all tests in this test file)
let _testDb: PostgresJsDatabase<typeof schema>;
let testClient: postgres.Sql;

/**
 * Get the initialized test database connection
 */
export function getTestDb(): PostgresJsDatabase<typeof schema> {
  if (!_testDb) {
    throw new Error("testDb not initialized. Ensure setup has run.");
  }
  return _testDb;
}

// Initialize database connection before all tests in this file
beforeAll(async () => {
  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL not set");
  }

  testClient = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  _testDb = drizzle(testClient, { schema });
});

// Cleanup connection after all tests in this file
afterAll(async () => {
  if (testClient) {
    await testClient.end();
  }
});
